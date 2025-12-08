# Jinja Template Guide for MSMM Engineering Project Writer

## Overview
Your existing `templates/jinja_template.docx` file needs to be modified to include Jinja2 template variables. This guide explains how to add these variables to your Word document template.

## Available Template Variables

The following variables are available for use in your DOCX template:

```
{{ title_location }}        - Project title and location
{{ year_professional }}     - Year completed for professional services
{{ year_construction }}     - Year completed for construction
{{ project_owner }}         - Name of the project owner
{{ point_of_contact }}      - Contact person for the project
{{ telephone }}             - Telephone number
{{ firm_name }}             - Engineering firm name (defaults to "MSMM Engineering")
{{ firm_location }}         - Firm's location
{{ roles }}                 - Roles and responsibilities description
{{ brief_description }}     - AI-generated project brief description
```

## How to Edit Your Template

### Step 1: Open Your Template
1. Open `templates/jinja_template.docx` in Microsoft Word
2. This is your existing template that you want to populate with data

### Step 2: Replace Static Text with Variables
Instead of having static text in your template, replace it with the Jinja2 variables.

**Example Before:**
```
Project: Highway Bridge Rehabilitation
Location: Downtown Bridge, City Name
```

**Example After:**
```
Project: {{ title_location }}
```

### Step 3: Use Variables Throughout the Document
You can use these variables anywhere in your document:

**Header Section:**
```
MSMM ENGINEERING PROJECT PROFILE

Project: {{ title_location }}
Professional Services Completed: {{ year_professional }}
Construction Completed: {{ year_construction }}
```

**Project Details Section:**
```
Client: {{ project_owner }}
Contact: {{ point_of_contact }}
Phone: {{ telephone }}

Engineering Firm: {{ firm_name }}
Location: {{ firm_location }}
```

**Description Section:**
```
PROJECT DESCRIPTION

{{ brief_description }}

ROLES AND RESPONSIBILITIES

{{ roles }}
```

## Advanced Jinja2 Features

### Conditional Content
You can show content only if a variable has a value:

```
{% if year_construction %}
Construction Completed: {{ year_construction }}
{% endif %}
```

### Default Values
Provide fallback text if a variable is empty:

```
Contact: {{ point_of_contact or "Contact information not provided" }}
```

### Formatting
You can format the variables:

```
Phone: {{ telephone or "N/A" }}
Project completed in {{ year_professional or "TBD" }}
```

## Tips for Best Results

1. **Save as DOCX**: Always save your template as a .docx file (not .doc)
2. **Test Variables**: Make sure variable names match exactly (case-sensitive)
3. **Preserve Formatting**: The Jinja variables will inherit the formatting of the surrounding text
4. **Use Paragraph Styles**: Apply Word styles to maintain consistent formatting

## Example Template Structure

```
===============================
MSMM ENGINEERING
PROJECT PORTFOLIO
===============================

PROJECT: {{ title_location }}

COMPLETION DATES
Professional Services: {{ year_professional }}
Construction: {{ year_construction }}

CLIENT INFORMATION
Owner: {{ project_owner }}
Contact Person: {{ point_of_contact }}
Telephone: {{ telephone }}

ENGINEERING FIRM
Firm: {{ firm_name }}
Location: {{ firm_location }}

PROJECT DESCRIPTION
{{ brief_description }}

ROLES & RESPONSIBILITIES
{{ roles }}
```

## Troubleshooting

**Issue: Variables not being replaced**
- Check spelling and case sensitivity
- Ensure the file is saved as .docx format
- Verify the file is named exactly `jinja_template.docx`

**Issue: Formatting problems**
- Apply Word styles instead of direct formatting
- Test with simple variables first, then add complexity

**Issue: Special characters**
- Avoid using special characters in variable names
- Use only letters, numbers, and underscores

## Testing Your Template

1. Fill out the web form with sample data
2. Upload some test documents
3. Generate a description and create the final document
4. Check that all variables are properly replaced
5. Verify formatting looks professional

Your template will be automatically populated with the form data and AI-generated description when users complete the web form! 