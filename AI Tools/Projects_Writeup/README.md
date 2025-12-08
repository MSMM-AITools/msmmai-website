# MSMM Engineering - Project Writer

A professional web application for MSMM Engineering to generate comprehensive project documentation using AI-powered brief descriptions and automated template filling.

## 🌟 Features

- **Professional Form Interface**: Clean, modern web interface for entering project details
- **Document Processing**: Upload and process multiple document formats (DOC, DOCX, PDF, TXT)
- **AI-Powered Content Generation**: Generate 3 different versions of project briefs using OpenAI GPT-4 Turbo
- **Customizable Parameters**: Control word count, paragraph structure, tense, and keywords
- **Template Integration**: Automatically fill Jinja2 templates with collected data
- **Professional Output**: Generate downloadable DOCX documents for project portfolios

## 📋 Form Fields

### Project Information
- Title & Location
- Year Completed - Professional Services
- Year Completed - Construction
- Project Owner
- Point of Contact
- Telephone Number
- Firm Name (defaults to "MSMM Engineering")
- Firm Location
- Roles & Responsibilities

### Brief Description Configuration
- Maximum word count (50-1000 words)
- Number of paragraphs (1-5)
- Paragraph titles (comma-separated)
- Keywords for inclusion
- Tense (past/present/future)

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8 or higher
- OpenAI API key

### Installation

1. **Clone or download the project files**

2. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Ensure your Jinja template is ready:**
   - Place your DOCX template file in the `templates/` directory
   - Name it `jinja_template.docx`
   - Use Jinja2 template variables in your DOCX file:
     - `{{ title_location }}`
     - `{{ year_professional }}`
     - `{{ year_construction }}`
     - `{{ project_owner }}`
     - `{{ point_of_contact }}`
     - `{{ telephone }}`
     - `{{ firm_name }}`
     - `{{ firm_location }}`
     - `{{ roles }}`
     - `{{ brief_description }}`

### Running the Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

## 📖 How to Use

### Step 1: Fill Project Information
- Enter all relevant project details in the form fields
- Required field: Title & Location
- Other fields are optional but recommended for complete documentation

### Step 2: Upload Project Documents
- Click the upload area or drag and drop files
- Supported formats: DOC, DOCX, PDF, TXT
- Maximum file size: 16MB per file
- Multiple files can be uploaded

### Step 3: Configure Brief Description
- Set maximum word count for the description
- Choose number of paragraphs
- Optionally specify paragraph titles (comma-separated)
- Add relevant keywords (comma-separated)
- Select appropriate tense (past/present/future)

### Step 4: Generate AI Descriptions
- Click "Generate Brief Descriptions"
- The AI will analyze your uploaded documents
- 3 different versions will be generated
- Review and select your preferred version

### Step 5: Generate Final Document
- After selecting a description version, click "Generate Final Document"
- The system will fill your Jinja template with all collected data
- A DOCX file will be automatically downloaded

## 🏗️ Technical Architecture

### Backend (Python/Flask)
- **app.py**: Main Flask application with all routes and functionality
- **Document Processing**: Extracts text from various file formats
- **OpenAI Integration**: Generates AI-powered descriptions
- **Template Processing**: Uses docxtpl for DOCX template rendering

### Frontend (HTML/CSS/JavaScript)
- **templates/index.html**: Main user interface
- **static/script.js**: Frontend logic and API interactions
- **Responsive Design**: Modern, professional styling
- **Drag & Drop**: Intuitive file upload experience

### Key Dependencies
- `Flask`: Web framework
- `python-docx`: Word document processing
- `docxtpl`: Jinja2 templating for DOCX files
- `openai`: AI text generation
- `PyPDF2`: PDF text extraction
- `python-docx2txt`: DOC/DOCX text extraction

## 🔧 Customization

### Modifying the Template
- Edit `templates/jinja_template.docx` to change the output format
- Use the variable names listed above in your template
- The template supports all Jinja2 features (loops, conditionals, etc.)

### Adjusting AI Prompts
- Modify the `generate_brief_description()` function in `app.py`
- Customize the system prompt for different writing styles
- Adjust temperature and max_tokens for different creativity levels

### Styling Changes
- Edit the CSS in `templates/index.html`
- Modify colors, fonts, and layout as needed
- The design uses CSS Grid and Flexbox for responsiveness

## 🚨 Security Considerations

- File uploads are limited to specific types and 16MB max size
- Uploaded files are processed and immediately deleted
- Temporary files are created in system temp directory
- Environment variables used for sensitive API keys

## 📞 Support

For technical support or feature requests related to MSMM Engineering's Project Writer, please contact your development team.

## 📄 License

This application is developed specifically for MSMM Engineering's internal use. 