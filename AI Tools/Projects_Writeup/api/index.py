import os
import tempfile
import json
import sys
from pathlib import Path
from flask import Flask, request, render_template, jsonify, send_file
from werkzeug.utils import secure_filename
import openai
from docxtpl import DocxTemplate
import PyPDF2
import docx2txt
from docx import Document
from dotenv import load_dotenv

# Add utils directory to path for auth middleware (3 levels up: api -> Projects_Writeup -> AI Tools -> root)
root_path = Path(__file__).parent.parent.parent.parent
auth_utils_path = root_path / 'AI Tools' / 'LicenseReminderTool-main' / 'utils'
if auth_utils_path.exists():
    sys.path.insert(0, str(auth_utils_path))
    from auth_middleware import require_auth
else:
    # Fallback: no auth if middleware not found
    print(f"[ProjectWriteup] Warning: Auth middleware not found at {auth_utils_path}", file=sys.stderr)
    def require_auth(f):
        return f

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__, template_folder='../templates', static_folder='../static')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configure OpenAI - client will be initialized per request

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path):
    """Extract text content from various file types"""
    text = ""
    file_extension = file_path.split('.')[-1].lower()
    
    try:
        if file_extension == 'pdf':
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        
        elif file_extension == 'docx':
            text = docx2txt.process(file_path)
        
        elif file_extension == 'doc':
            # For .doc files, we'll try to read as text (limited support)
            try:
                doc = Document(file_path)
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
            except:
                text = "Could not extract text from .doc file. Please use .docx format."
        
        elif file_extension == 'txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
                
    except Exception as e:
        text = f"Error extracting text from file: {str(e)}"
    
    return text

def extract_quotes_simple_search(documents_text):
    """Simple text-based quote extraction - completely avoids AI and JSON parsing"""
    import re
    
    quotes = []
    try:
        if not documents_text or len(documents_text.strip()) < 20:
            print("No sufficient text for quote extraction")
            return []
            
        lines = documents_text.split('\n')
        author_info = {}
        
        # Enhanced author detection patterns
        author_patterns = [
            r'(engineer|manager|director|president|CEO|supervisor|coordinator|specialist)',
            r'([A-Z][a-z]+ [A-Z][a-z]+),?\s*(engineer|manager|director|president|CEO)',
            r'(Best regards?|Sincerely|Thank you),?\s*([A-Z][a-z]+ [A-Z][a-z]+)',
            r'([A-Z][a-z]+ [A-Z][a-z]+)\s*[-–]\s*(engineer|manager|director)'
        ]
        
        # Find potential authors
        for i, line in enumerate(lines):
            line = line.strip()
            for pattern in author_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    groups = match.groups()
                    if len(groups) >= 2 and groups[1]:
                        name = groups[1]
                        title = groups[0] if groups[0] and 'engineer' in groups[0].lower() else 'Client'
                    elif len(groups) >= 1 and groups[0]:
                        name = groups[0]
                        title = 'Client Representative'
                    else:
                        continue
                    author_info[i] = {'name': name, 'title': title}
                    break
        
        # Enhanced positive feedback patterns
        positive_patterns = [
            r'excellent.*work',
            r'outstanding.*job',
            r'professional.*service',
            r'quality.*work',
            r'satisfied.*with',
            r'impressed.*with',
            r'recommend.*highly',
            r'great.*job',
            r'thank.*you.*for.*work',
            r'pleased.*with.*work',
            r'exceeded.*expectations',
            r'well.*done',
            r'appreciate.*your.*work'
        ]
        
        for i, line in enumerate(lines):
            line = line.strip()
            if 25 <= len(line) <= 150:  # Reasonable quote length
                for pattern in positive_patterns:
                    if re.search(pattern, line, re.IGNORECASE):
                        # Find closest author
                        closest_author = None
                        min_distance = float('inf')
                        for auth_line, auth_info in author_info.items():
                            distance = abs(i - auth_line)
                            if distance < min_distance and distance <= 8:
                                min_distance = distance
                                closest_author = auth_info
                        
                        quote_data = {
                            'quote': line.strip(),
                            'author': closest_author['name'] if closest_author else 'Project Client',
                            'title': closest_author['title'] if closest_author else 'Client Representative'
                        }
                        quotes.append(quote_data)
                        break
        
        # Remove duplicates and limit to 3
        seen_quotes = set()
        unique_quotes = []
        for quote in quotes:
            quote_text = quote['quote'].lower()
            if quote_text not in seen_quotes:
                seen_quotes.add(quote_text)
                unique_quotes.append(quote)
                if len(unique_quotes) >= 3:
                    break
        
        print(f"Text search found {len(unique_quotes)} valid quotes")
        return unique_quotes
        
    except Exception as e:
        print(f"Error in text-based quote search: {str(e)}")
        return []

def extract_and_generate_quotes(documents_text):
    """Extract quotes using OpenAI API with bulletproof JSON parsing"""
    try:
        if not documents_text or len(documents_text.strip()) < 20:
            print("No sufficient text for quote extraction")
            return []
            
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("No OpenAI API key available")
            return []
        
        print(f"Using OpenAI for quote extraction from {len(documents_text)} characters")
        
        client = openai.OpenAI(
            api_key=api_key,
            timeout=20.0,
            max_retries=0
        )
        
        # Simple, clear prompt that should always return valid JSON
        prompt = f"""
Extract 1-3 professional quotes from this business correspondence.

CRITICAL: Respond with ONLY a JSON array. No explanations, no markdown, no extra text.

Text to analyze:
{documents_text[:3000]}

Return format (ONLY this JSON, nothing else):
[{{"quote": "quote text", "author": "name", "title": "title"}}]

If no quotes found, return: []
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Faster and more reliable for simple tasks
            messages=[
                {"role": "system", "content": "You extract quotes from business documents. You ONLY return valid JSON arrays. Never include explanations or markdown."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,  # Limited tokens for focused response
            temperature=0.1
        )
        
        content = response.choices[0].message.content
        if not content:
            print("No content returned from OpenAI")
            return []
            
        # Clean and validate content before JSON parsing
        content = content.strip()
        
        # Remove any markdown formatting
        if content.startswith('```'):
            lines = content.split('\n')
            content = '\n'.join(lines[1:-1]) if len(lines) > 2 else content
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        # Check if it starts with error message
        if content.lower().startswith(('an error', 'error', 'i cannot', 'i apologize', 'sorry')):
            print(f"OpenAI returned error message: {content[:100]}...")
            return []
        
        # Validate JSON format before parsing
        if not (content.startswith('[') or content.startswith('{')):
            print(f"Response is not JSON format: {content[:100]}...")
            return []
        
        # Parse JSON with error handling
        try:
            quotes = json.loads(content)
            if not isinstance(quotes, list):
                print(f"Response is not a list: {type(quotes)}")
                return []
                
            # Validate each quote object
            validated_quotes = []
            for quote in quotes:
                if (isinstance(quote, dict) and 
                    quote.get('quote') and 
                    quote.get('author')):
                    validated_quotes.append({
                        'quote': str(quote.get('quote', '')).strip(),
                        'author': str(quote.get('author', 'Client')).strip(),
                        'title': str(quote.get('title', '')).strip()
                    })
            
            print(f"Successfully extracted {len(validated_quotes)} quotes via OpenAI")
            return validated_quotes[:3]  # Limit to 3 quotes
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {str(e)}")
            print(f"Content that failed: {content[:200]}...")
            return []
            
    except Exception as e:
        print(f"Error in OpenAI quote extraction: {str(e)}")
        return []

def generate_brief_description(documents_text, max_words, num_paragraphs, paragraph_titles, keywords, tense, user_prompt=None, quotes=None):
    """Generate brief description using OpenAI API"""
    try:
        # Prepare the prompt
        tense_instruction = {
            'present': 'Write in present tense',
            'past': 'Write in past tense', 
            'future': 'Write in future tense'
        }.get(tense, 'Write in past tense')
        
        prompt = f"""
        You are writing a professional project description for MSMM Engineering's portfolio. This is a standard business writing task for a civil engineering firm.
        
        TASK: Create a professional project brief description for a civil engineering project.
        
        WRITING REQUIREMENTS:
        - Write approximately {max_words} words (target word count - please write close to this number)
        - Create {num_paragraphs} well-structured paragraphs
        - Use professional, technical language appropriate for civil engineering
        - Write in {tense_instruction} tense
        - Focus on engineering methodologies, technical scope, and project outcomes
        
        CONTENT STRUCTURE:
        - Paragraph titles: {', '.join(paragraph_titles) if paragraph_titles else 'Use appropriate engineering-focused titles'}
        - Include these technical terms: {', '.join(keywords) if keywords else 'Use relevant civil engineering terminology'}
        - Highlight technical expertise and project deliverables
        - Describe engineering challenges and solutions
        
        PROJECT INFORMATION TO USE:
        {documents_text[:12000]}
        
        {f"""
        CLIENT FEEDBACK AVAILABLE:
        {chr(10).join([f'"{quote.get("quote", "")}" - {quote.get("author", "Unknown")}{", " + quote.get("title", "") if quote.get("title") else ""}' for quote in quotes if isinstance(quote, dict) and quote.get("quote")])}
        """ if quotes and len(quotes) > 0 and any(isinstance(q, dict) and q.get("quote") for q in quotes) else ""}
        
        Please write a comprehensive project description that showcases MSMM Engineering's technical capabilities. This description will be used in project portfolios and client presentations. Focus on the engineering work performed, methodologies used, and value delivered.
        
        {f"Additional requirements: {user_prompt}" if user_prompt else ""}
        
        Remember: Write approximately {max_words} words as requested. This is a legitimate business writing task for an engineering firm's project portfolio.
        """
        
        # Initialize OpenAI client with explicit configuration
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return "Error: OpenAI API key not configured"
        
        client = openai.OpenAI(
            api_key=api_key,
            timeout=45.0,  # Reduced timeout to fit within Vercel's limits
            max_retries=1   # Reduced retries to avoid timeout
        )
        
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a professional business writer who specializes in creating project descriptions for engineering firms. You write clear, detailed, and professional content for business portfolios and client presentations. You always complete the writing tasks as requested."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4000,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        if content:
            content = content.strip()
            # Check if the response is an error message
            content_lower = content.lower()
            if (content_lower.startswith('an error') or 
                content_lower.startswith('error') or 
                content_lower.startswith('i apologize') or
                content_lower.startswith('i cannot') or
                'error' in content_lower[:50]):
                error_msg = f"OpenAI API Error: {content[:200]}..."
                print(f"Description generation error: {error_msg}")
                return error_msg
            
            print(f"Description generation successful: {len(content)} characters")
            return content
        else:
            error_msg = "Error: No content generated"
            print(f"Description generation failed: {error_msg}")
            return error_msg
    
    except Exception as e:
        return f"Error generating description: {str(e)}"

@app.route('/')
@require_auth
def index():
    return render_template('index.html')

@app.route('/upload_documents', methods=['POST'])
@require_auth
def upload_documents():
    """Handle document uploads and extract text"""
    if 'documents' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    files = request.files.getlist('documents')
    extracted_texts = []
    
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Use temporary directory for Vercel
            temp_dir = tempfile.mkdtemp()
            file_path = os.path.join(temp_dir, filename)
            file.save(file_path)
            
            # Extract text from the file
            text = extract_text_from_file(file_path)
            extracted_texts.append({
                'filename': filename,
                'text': text,  # Store full text for AI processing
                'preview': text[:1000] + '...' if len(text) > 1000 else text  # Preview for display
            })
            
            # Clean up the uploaded file
            os.remove(file_path)
            os.rmdir(temp_dir)
    
    return jsonify({'extracted_texts': extracted_texts})

@app.route('/upload_quotes', methods=['POST'])
@require_auth
def upload_quotes():
    """Handle quote document uploads and extract quotes"""
    if 'quote_documents' not in request.files:
        return jsonify({'error': 'No quote files uploaded'}), 400
    
    files = request.files.getlist('quote_documents')
    all_quote_texts = []
    
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Use temporary directory for Vercel
            temp_dir = tempfile.mkdtemp()
            file_path = os.path.join(temp_dir, filename)
            file.save(file_path)
            
            # Extract text from the file
            text = extract_text_from_file(file_path)
            all_quote_texts.append({
                'filename': filename,
                'text': text
            })
            
            # Clean up the uploaded file
            os.remove(file_path)
            os.rmdir(temp_dir)
    
    # OpenAI-based quote extraction with bulletproof JSON handling
    extracted_quotes = []
    quote_extraction_error = None
    
    if all_quote_texts:
        try:
            combined_text = '\n\n'.join([doc['text'] for doc in all_quote_texts])
            if combined_text.strip():
                # Use OpenAI for intelligent quote extraction
                extracted_quotes = extract_and_generate_quotes(combined_text)
                
                # Fallback to simple text search if OpenAI fails
                if not extracted_quotes:
                    print("OpenAI quote extraction returned no quotes, trying fallback text search...")
                    extracted_quotes = extract_quotes_simple_search(combined_text)
                
                print(f"Quote extraction completed: {len(extracted_quotes)} quotes found")
            else:
                quote_extraction_error = "No text content found in uploaded files"
        except Exception as e:
            quote_extraction_error = f"Error in quote extraction: {str(e)}"
            print(quote_extraction_error)
            extracted_quotes = []
    
    if quote_extraction_error:
        return jsonify({
            'quotes': extracted_quotes,
            'processed_files': [doc['filename'] for doc in all_quote_texts],
            'warning': quote_extraction_error
        })
    else:
        return jsonify({
            'quotes': extracted_quotes,
            'processed_files': [doc['filename'] for doc in all_quote_texts]
        })

@app.route('/generate_descriptions', methods=['POST'])
@require_auth
def generate_descriptions():
    """Generate 3 versions of brief description using OpenAI"""
    data = request.get_json()
    
    # Extract parameters
    documents_text = data.get('documents_text', '')
    max_words = data.get('max_words', 200)
    num_paragraphs = data.get('num_paragraphs', 2)
    paragraph_titles = data.get('paragraph_titles', [])
    keywords = data.get('keywords', [])
    tense = data.get('tense', 'past')
    user_prompt = data.get('user_prompt', None)
    
    # Get quotes if provided - ensure it's a valid list (NO AI processing)
    quotes = data.get('quotes', [])
    if not isinstance(quotes, list):
        quotes = []
    
    # Validate quotes structure - only use properly formatted quotes
    valid_quotes = []
    try:
        for quote in quotes:
            if (isinstance(quote, dict) and 
                isinstance(quote.get('quote'), str) and 
                isinstance(quote.get('author'), str) and
                len(quote.get('quote', '').strip()) > 0):
                valid_quotes.append({
                    'quote': quote.get('quote', '').strip(),
                    'author': quote.get('author', 'Client').strip(),
                    'title': quote.get('title', '').strip()
                })
        quotes = valid_quotes[:3]  # Limit to 3 quotes
        print(f"Using {len(quotes)} validated quotes in description generation")
    except Exception as e:
        print(f"Error validating quotes: {str(e)}")
        quotes = []  # Use empty quotes if validation fails
    
    # Generate 3 different versions with detailed error tracking
    descriptions = []
    for i in range(3):
        try:
            print(f"Generating description version {i+1}...")
            description = generate_brief_description(
                documents_text, max_words, num_paragraphs, 
                paragraph_titles, keywords, tense, user_prompt, quotes
            )
            descriptions.append({
                'version': i + 1,
                'content': description
            })
            print(f"Successfully generated description version {i+1}")
        except json.JSONDecodeError as e:
            error_msg = f"JSON parsing error in description version {i+1}: {str(e)}"
            print(error_msg)
            # This shouldn't happen in description generation since we're not parsing JSON
            # If this occurs, it indicates a bug in the code
            print(f"UNEXPECTED JSON ERROR in description generation - this suggests a code bug")
            descriptions.append({
                'version': i + 1,
                'content': f"Unexpected JSON parsing error occurred. This may be a system issue."
            })
        except Exception as e:
            error_msg = f"Error generating description version {i+1}: {str(e)}"
            print(error_msg)
            descriptions.append({
                'version': i + 1,
                'content': f"Error: {str(e)}"
            })
    
    return jsonify({'descriptions': descriptions})

# Single request for one version at a time - helps with timeout issues
@app.route('/generate_single_description', methods=['POST'])
@require_auth
def generate_single_description():
    """Generate a single version of brief description - helps prevent timeouts"""
    data = request.get_json()
    
    # Extract parameters
    documents_text = data.get('documents_text', '')
    max_words = data.get('max_words', 200)
    num_paragraphs = data.get('num_paragraphs', 2)
    paragraph_titles = data.get('paragraph_titles', [])
    keywords = data.get('keywords', [])
    tense = data.get('tense', 'past')
    user_prompt = data.get('user_prompt', None)
    version_number = data.get('version_number', 1)
    
    # Get quotes if provided
    quotes = data.get('quotes', [])
    if not isinstance(quotes, list):
        quotes = []
    
    # Get selected quotes - new feature
    selected_quotes = data.get('selected_quotes', [])
    if selected_quotes:
        # Filter quotes to only include selected ones
        selected_quote_texts = set(selected_quotes)
        quotes = [q for q in quotes if isinstance(q, dict) and q.get('quote') in selected_quote_texts]
    
    # Validate quotes structure
    valid_quotes = []
    try:
        for quote in quotes:
            if (isinstance(quote, dict) and 
                isinstance(quote.get('quote'), str) and 
                isinstance(quote.get('author'), str) and
                len(quote.get('quote', '').strip()) > 0):
                valid_quotes.append({
                    'quote': quote.get('quote', '').strip(),
                    'author': quote.get('author', 'Client').strip(),
                    'title': quote.get('title', '').strip()
                })
        quotes = valid_quotes[:3]
        print(f"Using {len(quotes)} validated quotes in single description generation")
    except Exception as e:
        print(f"Error validating quotes: {str(e)}")
        quotes = []
    
    # Generate single version with retry logic
    max_retries = 2
    for retry in range(max_retries):
        try:
            print(f"Generating description version {version_number} (attempt {retry + 1})...")
            description = generate_brief_description(
                documents_text, max_words, num_paragraphs, 
                paragraph_titles, keywords, tense, user_prompt, quotes
            )
            
            print(f"Successfully generated description version {version_number}")
            return jsonify({
                'success': True,
                'description': {
                    'version': version_number,
                    'content': description
                }
            })
            
        except Exception as e:
            error_msg = f"Error generating description (attempt {retry + 1}): {str(e)}"
            print(error_msg)
            if retry == max_retries - 1:
                # Last retry failed
                return jsonify({
                    'success': False,
                    'error': f"Failed after {max_retries} attempts: {str(e)}",
                    'description': {
                        'version': version_number,
                        'content': f"Error: {str(e)}"
                    }
                })
            else:
                # Wait before retry
                import time
                time.sleep(2)
    
    # Should never reach here, but return error just in case
    return jsonify({
        'success': False,
        'error': 'Unexpected error in description generation',
        'description': {
            'version': version_number,
            'content': 'Error: Unexpected error occurred'
        }
    })

@app.route('/generate_document', methods=['POST'])
@require_auth
def generate_document():
    """Generate the final document using the Jinja template"""
    try:
        data = request.get_json()
        
        # Load the template from the correct path
        template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'jinja_template.docx')
        doc = DocxTemplate(template_path)
        
        # Prepare context data for template
        context = {
            'title_location': data.get('title_location', ''),
            'year_professional': data.get('year_professional', ''),
            'year_construction': data.get('year_construction', ''),
            'project_owner': data.get('project_owner', ''),
            'point_of_contact': data.get('point_of_contact', ''),
            'telephone': data.get('telephone', ''),
            'firm_name': data.get('firm_name', ''),
            'firm_location': data.get('firm_location', ''),
            'roles': data.get('roles', ''),
            'brief_description': data.get('brief_description', '')
        }
        
        # Render the template
        doc.render(context)
        
        # Save to temporary file
        temp_dir = tempfile.mkdtemp()
        output_path = os.path.join(temp_dir, 'project_document.docx')
        doc.save(output_path)
        
        return send_file(
            output_path, 
            as_attachment=True, 
            download_name='MSMM_Engineering_Project.docx',
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    
    except Exception as e:
        return jsonify({'error': f'Error generating document: {str(e)}'}), 500

# Export the Flask app for Vercel
app = app

if __name__ == '__main__':
    app.run(debug=True) 