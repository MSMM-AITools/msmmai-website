import os
import tempfile
from flask import Flask, request, render_template, jsonify, send_file
from werkzeug.utils import secure_filename
import openai
from docxtpl import DocxTemplate
import PyPDF2
import docx2txt
from docx import Document
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

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

def extract_and_generate_quotes(documents_text):
    """Extract and generate professional quotes from emails/letters"""
    try:
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        prompt = f"""
        Please analyze the following email/letter documents and extract professional quotes that would be suitable for a civil engineering project portfolio.
        
        INSTRUCTIONS:
        - Extract meaningful quotes about the project, service quality, or engineering work
        - Identify the name/title of the person who wrote each quote
        - Convert informal language into professional, formal quotes while maintaining the original sentiment
        - Format each quote with the person's name and title/organization if available
        - Only include quotes that reflect positively on engineering work or project outcomes
        
        DOCUMENTS:
        {documents_text[:8000]}
        
        Please return the quotes in the following JSON format:
        [
          {{
            "quote": "Professional quote text here",
            "author": "Name of person",
            "title": "Title/Organization if available"
          }}
        ]
        
        If no suitable quotes are found, return an empty array.
        """
        
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are an expert at extracting and formatting professional quotes from business correspondence. You maintain the original sentiment while ensuring professional language."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        content = response.choices[0].message.content
        if content:
            # Try to parse JSON response
            import json
            try:
                quotes = json.loads(content.strip())
                return quotes if isinstance(quotes, list) else []
            except json.JSONDecodeError:
                # If JSON parsing fails, return empty list
                return []
        return []
    
    except Exception as e:
        print(f"Error extracting quotes: {str(e)}")
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
        As a professional technical writer for MSMM Engineering, please create a comprehensive and formal project brief description based on the provided project documents. Maintain a professional, measured tone throughout.
        
        WRITING GUIDELINES:
        - Maintain a formal, professional tone
        - Use measured and precise language (avoid overly assertive claims)
        - Focus on factual accomplishments and technical details
        - Present information objectively and professionally
        
        TECHNICAL REQUIREMENTS:
        - Maximum {max_words} words
        - {num_paragraphs} paragraphs
        - Paragraph titles: {', '.join(paragraph_titles) if paragraph_titles else 'Use descriptive, professional titles'}
        - Include these keywords naturally: {', '.join(keywords) if keywords else 'Use relevant civil engineering terminology'}
        - All paragraphs should be in {tense_instruction} tense
        - Highlight technical competence and project methodologies
        - Include specific details from the documents such as project scope, engineering approaches, and delivered outcomes
        
        PROJECT DOCUMENTS AND SPECIFICATIONS:
        {documents_text[:12000]}
        
        {f"""
        CLIENT TESTIMONIALS AND QUOTES:
        {chr(10).join([f'"{quote["quote"]}" - {quote["author"]}{", " + quote["title"] if quote.get("title") else ""}' for quote in quotes])}
        """ if quotes and len(quotes) > 0 else ""}
        
        Based on the above project documentation{" and client testimonials" if quotes and len(quotes) > 0 else ""}, please develop a professional brief description that appropriately represents MSMM Engineering's technical capabilities and project contributions. The description should be suitable for client presentations, project portfolios, and professional documentation. Focus on the engineering methodologies employed, technical challenges addressed, and the value delivered to the client.
        
        {f"When appropriate, integrate relevant client testimonials into the description to support the technical achievements and project outcomes." if quotes and len(quotes) > 0 else ""}
        
        Please ensure the description maintains a professional tone and accurately reflects the project details provided in the documentation.
        
        {f"ADDITIONAL USER REQUIREMENTS: {user_prompt}" if user_prompt else ""}
        """
        
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a professional technical writer specializing in civil engineering project descriptions. You excel at creating comprehensive, accurate, and engaging project summaries based on technical documents and project specifications."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.6
        )
        
        content = response.choices[0].message.content
        return content.strip() if content else "Error: No content generated"
    
    except Exception as e:
        return f"Error generating description: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload_documents', methods=['POST'])
def upload_documents():
    """Handle document uploads and extract text"""
    if 'documents' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    files = request.files.getlist('documents')
    extracted_texts = []
    
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
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
    
    return jsonify({'extracted_texts': extracted_texts})

@app.route('/upload_quotes', methods=['POST'])
def upload_quotes():
    """Handle quote document uploads and extract quotes"""
    if 'quote_documents' not in request.files:
        return jsonify({'error': 'No quote files uploaded'}), 400
    
    files = request.files.getlist('quote_documents')
    all_quote_texts = []
    
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Extract text from the file
            text = extract_text_from_file(file_path)
            all_quote_texts.append({
                'filename': filename,
                'text': text
            })
            
            # Clean up the uploaded file
            os.remove(file_path)
    
    # Combine all quote texts and extract quotes
    combined_text = '\n\n'.join([doc['text'] for doc in all_quote_texts])
    extracted_quotes = extract_and_generate_quotes(combined_text)
    
    return jsonify({
        'quotes': extracted_quotes,
        'processed_files': [doc['filename'] for doc in all_quote_texts]
    })

@app.route('/generate_descriptions', methods=['POST'])
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
    
    # Get quotes if provided
    quotes = data.get('quotes', [])
    
    # Generate 3 different versions
    descriptions = []
    for i in range(3):
        description = generate_brief_description(
            documents_text, max_words, num_paragraphs, 
            paragraph_titles, keywords, tense, user_prompt, quotes
        )
        descriptions.append({
            'version': i + 1,
            'content': description
        })
    
    return jsonify({'descriptions': descriptions})

@app.route('/generate_single_description', methods=['POST'])
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
    
    try:
        description = generate_brief_description(
            documents_text, max_words, num_paragraphs, 
            paragraph_titles, keywords, tense, user_prompt, quotes
        )
        
        return jsonify({
            'success': True,
            'description': {
                'version': version_number,
                'content': description
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'description': {
                'version': version_number,
                'content': f"Error: {str(e)}"
            }
        })

@app.route('/generate_document', methods=['POST'])
def generate_document():
    """Generate the final document using the Jinja template"""
    try:
        data = request.get_json()
        
        # Load the template
        template_path = os.path.join('templates', 'jinja_template.docx')
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

if __name__ == '__main__':
    app.run(debug=True) 