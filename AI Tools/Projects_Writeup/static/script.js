let uploadedDocuments = [];
let extractedTexts = [];
let selectedDescription = '';
let extractedQuotes = [];
let currentFormData = {};

document.addEventListener('DOMContentLoaded', function() {
    // File upload functionality
    const fileUploadArea = document.getElementById('fileUploadArea');
    const documentFiles = document.getElementById('documentFiles');
    const uploadedFilesDiv = document.getElementById('uploadedFiles');
    
    // Quote upload functionality
    const quoteUploadArea = document.getElementById('quoteUploadArea');
    const quoteFiles = document.getElementById('quoteFiles');
    const uploadedQuotesDiv = document.getElementById('uploadedQuotes');

    // Drag and drop functionality for project documents
    fileUploadArea.addEventListener('click', () => documentFiles.click());
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleDrop);
    documentFiles.addEventListener('change', handleFileSelect);

    // Quote upload functionality
    quoteUploadArea.addEventListener('click', () => quoteFiles.click());
    quoteUploadArea.addEventListener('dragover', handleQuoteDragOver);
    quoteUploadArea.addEventListener('dragleave', handleQuoteDragLeave);
    quoteUploadArea.addEventListener('drop', handleQuoteDrop);
    quoteFiles.addEventListener('change', handleQuoteFileSelect);

    // Button event listeners
    document.getElementById('generateDescriptionsBtn').addEventListener('click', generateDescriptions);
    document.getElementById('generateDocumentBtn').addEventListener('click', generateDocument);
    
    // Regenerate functionality (will be added after descriptions are generated)
    // document.getElementById('regenerateDescriptionsBtn').addEventListener('click', regenerateDescriptions);

    function handleDragOver(e) {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        const formData = new FormData();
        
        for (let file of files) {
            if (isValidFile(file)) {
                formData.append('documents', file);
                uploadedDocuments.push(file);
            } else {
                showAlert(`File "${file.name}" is not supported. Please use DOC, DOCX, PDF, or TXT files.`, 'danger');
            }
        }

        if (formData.has('documents')) {
            uploadFiles(formData);
        }
    }

    function isValidFile(file) {
        const allowedTypes = ['application/pdf', 'application/msword', 
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'text/plain'];
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
        
        return allowedTypes.includes(file.type) || 
               allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    }

    // Quote handling functions
    function handleQuoteDragOver(e) {
        e.preventDefault();
        quoteUploadArea.classList.add('dragover');
    }

    function handleQuoteDragLeave(e) {
        e.preventDefault();
        quoteUploadArea.classList.remove('dragover');
    }

    function handleQuoteDrop(e) {
        e.preventDefault();
        quoteUploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleQuoteFiles(files);
    }

    function handleQuoteFileSelect(e) {
        const files = e.target.files;
        handleQuoteFiles(files);
    }

    function handleQuoteFiles(files) {
        const formData = new FormData();
        
        for (let file of files) {
            if (isValidQuoteFile(file)) {
                formData.append('quote_documents', file);
            } else {
                showAlert(`File "${file.name}" is not supported for quotes. Please use DOC, DOCX, or PDF files.`, 'danger');
            }
        }

        if (formData.has('quote_documents')) {
            uploadQuoteFiles(formData);
        }
    }

    function isValidQuoteFile(file) {
        const allowedTypes = ['application/pdf', 'application/msword', 
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        
        return allowedTypes.includes(file.type) || 
               allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    }

    async function uploadFiles(formData) {
        try {
            showLoading(true);
            
            const response = await fetch('/upload_documents', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                extractedTexts = extractedTexts.concat(result.extracted_texts);
                displayUploadedFiles(result.extracted_texts);
                showAlert('Files uploaded and processed successfully!', 'success');
            } else {
                showAlert(result.error || 'Error uploading files', 'danger');
            }
        } catch (error) {
            showAlert('Error uploading files: ' + error.message, 'danger');
        } finally {
            showLoading(false);
        }
    }

    function displayUploadedFiles(files) {
        files.forEach(file => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-item';
            fileDiv.innerHTML = `
                <div class="file-name"><i class="fas fa-file-alt"></i> ${file.filename}</div>
                <div class="file-preview">${file.preview || file.text}</div>
            `;
            uploadedFilesDiv.appendChild(fileDiv);
        });
    }

    async function uploadQuoteFiles(formData) {
        try {
            showLoading(true, 'Processing quote documents with AI...');
            
            const response = await fetch('/upload_quotes', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                extractedQuotes = result.quotes;
                displayUploadedQuoteFiles(result.processed_files);
                displayExtractedQuotes(result.quotes);
                
                let message = `Successfully processed ${result.processed_files.length} quote files and extracted ${result.quotes.length} quotes!`;
                if (result.warning) {
                    message += ` Warning: ${result.warning}`;
                }
                showAlert(message, result.warning ? 'warning' : 'success');
            } else {
                showAlert(result.error || 'Error uploading quote files', 'danger');
            }
        } catch (error) {
            showAlert('Error uploading quote files: ' + error.message, 'danger');
        } finally {
            showLoading(false);
        }
    }

    function displayUploadedQuoteFiles(filenames) {
        filenames.forEach(filename => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-item';
            fileDiv.innerHTML = `
                <div class="file-name"><i class="fas fa-envelope"></i> ${filename}</div>
                <div class="file-preview">Quote document processed successfully</div>
            `;
            uploadedQuotesDiv.appendChild(fileDiv);
        });
    }

    function displayExtractedQuotes(quotes) {
        const extractedQuotesDiv = document.getElementById('extractedQuotes');
        const quotesContainer = document.getElementById('quotesContainer');
        
        if (quotes.length > 0) {
            quotesContainer.innerHTML = '';
            quotes.forEach((quote, index) => {
                const quoteDiv = document.createElement('div');
                quoteDiv.className = 'quote-item';
                quoteDiv.innerHTML = `
                    <div class="quote-checkbox">
                        <input type="checkbox" id="quote-${index}" name="selected-quotes" value="${quote.quote}" checked>
                        <label for="quote-${index}">
                            <div class="quote-text">"${quote.quote}"</div>
                            <div class="quote-author">- ${quote.author}${quote.title ? ', ' + quote.title : ''}</div>
                        </label>
                    </div>
                `;
                quotesContainer.appendChild(quoteDiv);
            });
            extractedQuotesDiv.style.display = 'block';
            
            // Add info text about quote selection
            const infoText = document.createElement('div');
            infoText.className = 'quote-info';
            infoText.innerHTML = '<i class="fas fa-info-circle"></i> Select the quotes you want to include in the brief descriptions';
            quotesContainer.insertBefore(infoText, quotesContainer.firstChild);
        }
    }

    async function generateDescriptions() {
        if (extractedTexts.length === 0) {
            showAlert('Please upload some documents first.', 'danger');
            return;
        }

        const documentsText = extractedTexts.map(doc => doc.text).join('\n\n');
        const maxWords = parseInt(document.getElementById('max_words').value);
        const numParagraphs = parseInt(document.getElementById('num_paragraphs').value);
        const paragraphTitles = document.getElementById('paragraph_titles').value
            .split(',').map(title => title.trim()).filter(title => title);
        const keywords = document.getElementById('keywords').value
            .split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
        const tense = document.getElementById('tense').value;
        const numResponses = parseInt(document.getElementById('num_responses').value);
        
        // Get selected quotes
        const selectedQuoteElements = document.querySelectorAll('input[name="selected-quotes"]:checked');
        const selectedQuotes = Array.from(selectedQuoteElements).map(el => el.value);

        // Save current form data for regeneration
        currentFormData = {
            documents_text: documentsText,
            max_words: maxWords,
            num_paragraphs: numParagraphs,
            paragraph_titles: paragraphTitles,
            keywords: keywords,
            tense: tense,
            quotes: extractedQuotes,
            selected_quotes: selectedQuotes,
            num_responses: numResponses
        };

        try {
            showLoading(true, `Generating descriptions using AI (0/${numResponses})...`);
            
            // Generate descriptions one by one to avoid timeout
            const descriptions = [];
            
            for (let i = 0; i < numResponses; i++) {
                showLoading(true, `Generating description ${i + 1} of ${numResponses}...`);
                
                const requestData = {
                    ...currentFormData,
                    version_number: i + 1
                };
                
                const response = await fetch('/generate_single_description', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                    signal: AbortSignal.timeout(55000) // 55 second timeout
                });

                const result = await response.json();
                
                if (response.ok && result.success) {
                    descriptions.push(result.description);
                } else {
                    // Add error description but continue with others
                    descriptions.push({
                        version: i + 1,
                        content: result.error || 'Error generating this version'
                    });
                }
            }

            displayDescriptionVersions(descriptions);
            showAlert('AI descriptions generated successfully!', 'success');
            
        } catch (error) {
            if (error.name === 'AbortError') {
                showAlert('Request timed out. Please try again with fewer documents or shorter content.', 'danger');
            } else {
                showAlert('Error generating descriptions: ' + error.message, 'danger');
            }
        } finally {
            showLoading(false);
        }
    }

    function displayDescriptionVersions(descriptions) {
        const versionsContainer = document.getElementById('versionsContainer');
        const descriptionVersions = document.getElementById('descriptionVersions');
        
        versionsContainer.innerHTML = '';
        
        descriptions.forEach((desc, index) => {
            const versionDiv = document.createElement('div');
            versionDiv.className = 'version-editable';
            versionDiv.innerHTML = `
                <div class="version-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: 600; color: #2c3e50;">Version ${desc.version}</span>
                    <button class="copy-btn" onclick="copyToCustom(${index})">
                        <i class="fas fa-copy"></i> Copy to Custom
                    </button>
                </div>
                <textarea class="version-textarea" id="version-${index}" data-version="${desc.version}">${desc.content}</textarea>
            `;
            
            versionsContainer.appendChild(versionDiv);
        });

        descriptionVersions.style.display = 'block';
        document.getElementById('generateDocumentBtn').classList.remove('hidden');
        
        // Show regenerate section and add event listener
        const regenerateSection = document.getElementById('regenerateSection');
        regenerateSection.style.display = 'block';
        
        // Remove any existing event listener and add new one
        const regenerateBtn = document.getElementById('regenerateDescriptionsBtn');
        const newRegenerateBtn = regenerateBtn.cloneNode(true);
        regenerateBtn.parentNode.replaceChild(newRegenerateBtn, regenerateBtn);
        newRegenerateBtn.addEventListener('click', regenerateDescriptions);
    }

    // Function to copy text to custom description
    window.copyToCustom = function(index) {
        const sourceTextarea = document.getElementById(`version-${index}`);
        const customTextarea = document.getElementById('customDescription');
        const currentCustomText = customTextarea.value.trim();
        
        if (currentCustomText) {
            // If there's already text, append with a line break
            customTextarea.value = currentCustomText + '\n\n' + sourceTextarea.value;
        } else {
            customTextarea.value = sourceTextarea.value;
        }
        
        // Scroll to custom description
        customTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Flash effect to show copy success
        customTextarea.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.3)';
        setTimeout(() => {
            customTextarea.style.boxShadow = '';
        }, 1000);
        
        showAlert('Description copied to custom field!', 'success');
    }

    async function regenerateDescriptions() {
        const userPrompt = document.getElementById('userPrompt').value.trim();
        
        if (!userPrompt) {
            showAlert('Please provide additional instructions for regeneration.', 'danger');
            return;
        }

        if (!currentFormData.documents_text) {
            showAlert('No previous data found. Please generate descriptions first.', 'danger');
            return;
        }

        // Get currently selected quotes
        const selectedQuoteElements = document.querySelectorAll('input[name="selected-quotes"]:checked');
        const selectedQuotes = Array.from(selectedQuoteElements).map(el => el.value);
        
        // Add user prompt and selected quotes to the current form data
        const regenerateData = {
            ...currentFormData,
            user_prompt: userPrompt,
            selected_quotes: selectedQuotes
        };

        const numResponses = currentFormData.num_responses || 3;
        
        try {
            showLoading(true, `Regenerating descriptions with your requirements (0/${numResponses})...`);
            
            // Generate descriptions one by one to avoid timeout
            const descriptions = [];
            
            for (let i = 0; i < numResponses; i++) {
                showLoading(true, `Regenerating description ${i + 1} of ${numResponses}...`);
                
                const requestData = {
                    ...regenerateData,
                    version_number: i + 1
                };
                
                const response = await fetch('/generate_single_description', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                    signal: AbortSignal.timeout(55000) // 55 second timeout
                });

                const result = await response.json();
                
                if (response.ok && result.success) {
                    descriptions.push(result.description);
                } else {
                    // Add error description but continue with others
                    descriptions.push({
                        version: i + 1,
                        content: result.error || 'Error generating this version'
                    });
                }
            }

            displayDescriptionVersions(descriptions);
            showAlert('New descriptions generated successfully with your requirements!', 'success');
            // Clear the user prompt
            document.getElementById('userPrompt').value = '';
            
        } catch (error) {
            if (error.name === 'AbortError') {
                showAlert('Request timed out. Please try again with fewer documents or shorter content.', 'danger');
            } else {
                showAlert('Error regenerating descriptions: ' + error.message, 'danger');
            }
        } finally {
            showLoading(false);
        }
    }

    async function generateDocument() {
        // Get custom description first, if empty check for edited versions
        let finalDescription = document.getElementById('customDescription').value.trim();
        
        if (!finalDescription) {
            // Check if any version textarea has content
            const versionTextareas = document.querySelectorAll('.version-textarea');
            for (let textarea of versionTextareas) {
                if (textarea.value.trim()) {
                    finalDescription = textarea.value.trim();
                    break;
                }
            }
        }
        
        if (!finalDescription) {
            showAlert('Please write a custom description or edit one of the generated versions.', 'danger');
            return;
        }

        const formData = new FormData(document.getElementById('projectForm'));
        const projectData = Object.fromEntries(formData.entries());
        projectData.brief_description = finalDescription;

        try {
            showLoading(true, 'Generating final document...');

            const response = await fetch('/generate_document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData)
            });

            if (response.ok) {
                // Download the generated document
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'MSMM_Engineering_Project.docx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                showAlert('Document generated and downloaded successfully!', 'success');
            } else {
                const result = await response.json();
                showAlert(result.error || 'Error generating document', 'danger');
            }
        } catch (error) {
            showAlert('Error generating document: ' + error.message, 'danger');
        } finally {
            showLoading(false);
        }
    }

    function showLoading(show, message = 'Loading...') {
        const loadingDiv = document.getElementById('loading');
        if (show) {
            loadingDiv.querySelector('p').textContent = message;
            loadingDiv.style.display = 'block';
        } else {
            loadingDiv.style.display = 'none';
        }
    }

    function showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        
        let icon = 'exclamation-triangle';
        if (type === 'success') icon = 'check-circle';
        else if (type === 'warning') icon = 'exclamation-triangle';
        else if (type === 'danger') icon = 'times-circle';
        
        alertDiv.innerHTML = `
            <i class="fas fa-${icon}"></i>
            ${message}
        `;

        // Insert at the top of form container
        const formContainer = document.querySelector('.form-container');
        formContainer.insertBefore(alertDiv, formContainer.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);

        // Scroll to top to show the alert
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}); 