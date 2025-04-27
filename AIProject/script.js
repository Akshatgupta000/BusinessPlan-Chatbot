document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const exportBtn = document.getElementById('export-btn');
    const exportOptions = document.getElementById('export-options');
    const templateOptions = document.querySelectorAll('.template-option');
    
    // Add section tracking
    let currentSection = 0;
    const sections = [
        "executive summary",
        "company description",
        "market analysis",
        "organization and management",
        "service or product line",
        "marketing and sales",
        "funding request",
        "financial projections",
        "appendix"
    ];
    
    let currentBusinessPlan = {};
    let currentTemplate = "";
    
    // Add Gemini API integration
    async function generateAIResponse(message) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a business plan assistant. Provide short, concise answers. Keep each point on a new line. Maximum 3-4 points per response. User message: ${message}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data); // For debugging
            
            if (data.error) {
                throw new Error(data.error.message || 'API Error');
            }

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                // Format the response to remove bullet points and clean up the text
                let response = data.candidates[0].content.parts[0].text;
                // Remove bullet points and clean up the text
                response = response.replace(/[•\-\*]/g, '').trim();
                // Ensure each point is on a new line
                response = response.split('\n').map(line => line.trim()).filter(line => line).join('\n');
                return response;
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('Error generating AI response:', error);
            if (error.message.includes('API key')) {
                return "There's an issue with the API configuration. Please check your API key.";
            } else if (error.message.includes('HTTP error')) {
                return "There's a network issue. Please check your internet connection and try again.";
            } else {
                return "I apologize, but I'm having trouble generating a response right now. Please try again.";
            }
        }
    }

    function isBusinessRelated(message) {
        const businessKeywords = [
            'business', 'company', 'startup', 'entrepreneur', 'market', 'product', 'service',
            'finance', 'investment', 'revenue', 'profit', 'customer', 'client', 'sales',
            'marketing', 'strategy', 'plan', 'management', 'team', 'funding', 'capital',
            'industry', 'competitor', 'brand', 'pricing', 'cost', 'budget', 'financial',
            'growth', 'scale', 'partnership', 'supplier', 'vendor', 'inventory', 'logistics',
            'operation', 'process', 'efficiency', 'productivity', 'quality', 'risk',
            'opportunity', 'challenge', 'goal', 'objective', 'target', 'milestone', 'timeline',
            'deadline', 'resource', 'asset', 'liability', 'equity', 'debt', 'loan', 'credit',
            'cash flow', 'balance sheet', 'income statement', 'profit and loss', 'break even',
            'return on investment', 'ROI', 'valuation', 'exit strategy', 'acquisition', 'merger',
            'franchise', 'license', 'patent', 'trademark', 'copyright', 'intellectual property',
            'compliance', 'regulation', 'legal', 'contract', 'agreement', 'partnership',
            'stakeholder', 'shareholder', 'board', 'director', 'executive', 'employee',
            'workforce', 'talent', 'skill', 'training', 'development', 'culture', 'value',
            'mission', 'vision', 'purpose', 'impact', 'sustainability', 'social responsibility',
            'corporate', 'enterprise', 'organization', 'firm', 'corporation', 'LLC', 'inc',
            'limited', 'partnership', 'sole proprietorship', 'cooperative', 'nonprofit',
            'charity', 'foundation', 'association', 'institute', 'center', 'agency',
            'department', 'division', 'unit', 'branch', 'office', 'location', 'premise',
            'facility', 'warehouse', 'store', 'shop', 'outlet', 'showroom', 'headquarters',
            'HQ', 'main office', 'regional office', 'local office', 'virtual office',
            'remote work', 'telecommute', 'work from home', 'WFH', 'hybrid work',
            'flexible work', 'schedule', 'time', 'attendance', 'leave', 'vacation',
            'holiday', 'sick', 'benefit', 'compensation', 'salary', 'wage', 'bonus',
            'commission', 'incentive', 'reward', 'recognition', 'appreciation', 'feedback',
            'performance', 'evaluation', 'review', 'assessment', 'appraisal', 'rating',
            'score', 'metric', 'KPI', 'indicator', 'measure', 'track', 'monitor',
            'analyze', 'report', 'dashboard', 'scorecard', 'benchmark', 'standard',
            'best practice', 'guideline', 'policy', 'procedure', 'protocol', 'system',
            'process', 'workflow', 'automation', 'technology', 'software', 'hardware',
            'equipment', 'tool', 'resource', 'material', 'supply', 'inventory',
            'stock', 'order', 'purchase', 'buy', 'sell', 'trade', 'exchange',
            'transaction', 'deal', 'agreement', 'contract', 'negotiation', 'bargain',
            'discount', 'promotion', 'offer', 'deal', 'special', 'sale', 'clearance',
            'markdown', 'rebate', 'refund', 'return', 'exchange', 'warranty', 'guarantee',
            'service', 'support', 'help', 'assistance', 'advice', 'consultation',
            'counseling', 'coaching', 'mentoring', 'training', 'education', 'learning',
            'development', 'growth', 'improvement', 'enhancement', 'optimization',
            'efficiency', 'productivity', 'quality', 'excellence', 'standard',
            'certification', 'accreditation', 'license', 'permit', 'registration',
            'compliance', 'regulation', 'law', 'rule', 'policy', 'procedure',
            'guideline', 'standard', 'requirement', 'specification', 'criteria',
            'condition', 'term', 'clause', 'provision', 'stipulation', 'agreement',
            'contract', 'document', 'record', 'file', 'database', 'system',
            'software', 'application', 'program', 'tool', 'resource', 'asset',
            'property', 'equipment', 'facility', 'infrastructure', 'network',
            'connection', 'relationship', 'partnership', 'alliance', 'collaboration',
            'cooperation', 'coordination', 'integration', 'alignment', 'synergy',
            'harmony', 'balance', 'stability', 'security', 'safety', 'protection',
            'insurance', 'coverage', 'policy', 'premium', 'claim', 'benefit',
            'compensation', 'reimbursement', 'payment', 'fee', 'charge', 'cost',
            'expense', 'investment', 'capital', 'fund', 'money', 'cash', 'currency',
            'exchange', 'rate', 'value', 'price', 'cost', 'expense', 'budget',
            'forecast', 'projection', 'plan', 'strategy', 'tactic', 'approach',
            'method', 'technique', 'process', 'procedure', 'system', 'framework',
            'model', 'template', 'format', 'structure', 'organization', 'design',
            'layout', 'arrangement', 'composition', 'configuration', 'setup',
            'installation', 'implementation', 'execution', 'operation', 'function',
            'performance', 'efficiency', 'effectiveness', 'productivity', 'quality',
            'excellence', 'standard', 'benchmark', 'target', 'goal', 'objective',
            'purpose', 'mission', 'vision', 'value', 'principle', 'belief',
            'philosophy', 'culture', 'tradition', 'custom', 'practice', 'habit',
            'routine', 'schedule', 'calendar', 'timeline', 'deadline', 'milestone',
            'achievement', 'success', 'accomplishment', 'result', 'outcome',
            'impact', 'effect', 'consequence', 'benefit', 'advantage', 'value',
            'worth', 'importance', 'significance', 'relevance', 'connection',
            'relation', 'association', 'link', 'bond', 'tie'
        ];

        // Common conversational words and phrases that should be allowed
        const allowedConversationalWords = [
            'yes', 'no', 'ok', 'okay', 'sure', 'please', 'thanks', 'thank you',
            'explain', 'explain in detail', 'explain briefly', 'tell me more',
            'what do you mean', 'can you clarify', 'i understand', 'i see',
            'got it', 'alright', 'fine', 'good', 'great', 'perfect', 'excellent',
            'help', 'assist', 'guide', 'show', 'demonstrate', 'example',
            'how', 'what', 'when', 'where', 'why', 'which', 'who', 'whose',
            'next', 'previous', 'back', 'forward', 'continue', 'stop', 'end',
            'start', 'begin', 'first', 'last', 'more', 'less', 'enough',
            'clear', 'understand', 'confused', 'question', 'answer', 'reply',
            'response', 'feedback', 'comment', 'suggestion', 'advice', 'tip',
            'hint', 'clue', 'idea', 'thought', 'opinion', 'view', 'perspective',
            'point', 'aspect', 'part', 'section', 'topic', 'subject', 'matter',
            'issue', 'problem', 'solution', 'way', 'method', 'approach', 'style',
            'format', 'type', 'kind', 'sort', 'category', 'group', 'class',
            'level', 'degree', 'extent', 'amount', 'number', 'quantity', 'size',
            'scale', 'range', 'scope', 'limit', 'boundary', 'edge', 'border',
            'line', 'point', 'mark', 'sign', 'symbol', 'indicator', 'measure',
            'unit', 'standard', 'criterion', 'rule', 'principle', 'law', 'theory',
            'concept', 'notion', 'idea', 'thought', 'belief', 'view', 'opinion',
            'perspective', 'standpoint', 'position', 'stance', 'attitude', 'mood',
            'tone', 'style', 'manner', 'way', 'fashion', 'mode', 'form', 'shape',
            'structure', 'pattern', 'design', 'layout', 'arrangement', 'order',
            'sequence', 'series', 'chain', 'link', 'connection', 'relation',
            'relationship', 'association', 'bond', 'tie', 'connection', 'network',
            'web', 'system', 'structure', 'organization', 'arrangement', 'composition',
            'configuration', 'setup', 'installation', 'implementation', 'execution',
            'operation', 'function', 'performance', 'efficiency', 'effectiveness',
            'productivity', 'quality', 'excellence', 'standard', 'benchmark', 'target',
            'goal', 'objective', 'purpose', 'mission', 'vision', 'value', 'principle',
            'belief', 'philosophy', 'culture', 'tradition', 'custom', 'practice',
            'habit', 'routine', 'schedule', 'calendar', 'timeline', 'deadline',
            'milestone', 'achievement', 'success', 'accomplishment', 'result',
            'outcome', 'impact', 'effect', 'consequence', 'benefit', 'advantage',
            'value', 'worth', 'importance', 'significance', 'relevance', 'connection',
            'relation', 'association', 'link', 'bond', 'tie'
        ];

        // Convert message to lowercase for case-insensitive matching
        const lowerMessage = message.toLowerCase();
        
        // Check if message contains any business-related keywords or allowed conversational words
        return businessKeywords.some(keyword => lowerMessage.includes(keyword)) ||
               allowedConversationalWords.some(word => lowerMessage.includes(word));
    }

    // Modify the processMessage function to use topic checker
    async function processMessage(message) {
        message = message.toLowerCase();
        
        // Check if message is business-related
        if (!isBusinessRelated(message)) {
            addMessage("I'm sorry, but I can only assist with business-related topics. Please ask me about business planning, strategy, or other business-related matters.", 'bot');
            return;
        }
        
        // Check if user is asking about specific business plan sections
        for (const section of sections) {
            if (message.includes(section)) {
                provideSectionGuidance(section);
                return;
            }
        }

        // Handle section progression
        if (currentBusinessPlan.name && message.length > 10) {
            currentBusinessPlan.sections[sections[currentSection]] = message;
            currentSection++;
            
            if (currentSection < sections.length) {
                setTimeout(() => {
                    addMessage(`Great! Now let's move on to the ${sections[currentSection].charAt(0).toUpperCase() + sections[currentSection].slice(1)}. Can you provide information about this section?`, 'bot');
                }, 1000);
            } else {
                setTimeout(() => {
                    addMessage("We've covered all the main sections. Feel free to ask any questions about your business plan or click 'Generate' when you're ready to see your report.", 'bot');
                }, 1000);
            }
            return;
        }
        
        // Check if business name is mentioned
        const businessNameInput = document.getElementById('business-name');
        if (message.includes('name') && message.includes('business') && businessNameInput.value === '') {
            addMessage("What's the name of your business?", 'bot');
            return;
        }
        
        // Check if industry is mentioned
        const industryInput = document.getElementById('industry');
        if (message.includes('industry') && industryInput.value === '') {
            addMessage("What industry does your business operate in?", 'bot');
            return;
        }
        
        // Check if business stage is mentioned
        const stageInput = document.getElementById('stage');
        if ((message.includes('stage') || message.includes('phase')) && stageInput.value === '') {
            addMessage("What stage is your business in? (Idea, Startup, Established, or Expanding)", 'bot');
            return;
        }
        
        // Check if user wants to select a template
        if (message.includes('template') || message.includes('plan type')) {
            addMessage("I offer three business plan templates: Standard Business Plan, Lean Business Plan, and Investor Pitch Plan. Which would you prefer?", 'bot');
            return;
        }
        
        // Check if user wants to generate a business plan
        if (message.includes('generate') || message.includes('create') || message.includes('make') || 
            message.includes('start') || message.includes('business plan')) {
            
            addMessage("To generate your business plan report, please click the 'Generate' button in the sidebar when you're ready.", 'bot');
            return;
        }

        // Use Gemini API for other responses
        const aiResponse = await generateAIResponse(message);
        addMessage(aiResponse, 'bot');
    }

    // Modify the sendMessage function to handle async responses
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessage(message, 'user');
        userInput.value = '';
        
        // Show typing indicator
        typingIndicator.style.display = 'flex';
        scrollToBottom();
        
        // Process the message and get response
        await processMessage(message);
        typingIndicator.style.display = 'none';
        scrollToBottom();
    }
    
    // Add a message to the chat
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Start generating the business plan
    function startBusinessPlanGeneration(businessName, industry, stage) {
        addMessage(`Great! I'll help you create a ${currentTemplate} Business Plan for ${businessName} in the ${industry} industry. Let's get started!`, 'bot');
        
        setTimeout(() => {
            addMessage(`Let's begin with the ${sections[currentSection].charAt(0).toUpperCase() + sections[currentSection].slice(1)}. Can you provide information about this section?`, 'bot');
        }, 1000);
        
        // Initialize business plan object
        currentBusinessPlan = {
            name: businessName,
            industry: industry,
            stage: stage,
            template: currentTemplate,
            sections: {}
        };
    }
    
    // Provide guidance for specific business plan sections
    function provideSectionGuidance(section) {
        const guidance = {
            "executive summary": "The Executive Summary provides a brief overview of your entire business plan. Although it appears first, it's best to write it last. Include your business concept, goals, mission statement, and basic information about your company, products/services, and leadership.",
            "company description": "The Company Description provides detailed information about your business structure, what problems you solve, your target market, and your competitive advantages.",
            "market analysis": "The Market Analysis demonstrates your knowledge of the industry and market. Include research on your target market, industry trends, and competitor analysis.",
            "organization and management": "This section should outline your business structure, management team, and their qualifications. Include an organizational chart and details about ownership.",
            "service or product line": "Describe what you're selling and how it benefits customers. Explain any intellectual property, R&D activities, or comparative advantages.",
            "marketing and sales": "Detail your marketing strategy and sales plan. How will you attract and retain customers? What's your sales strategy and sales force structure?",
            "funding request": "If you're seeking funding, outline how much you need over the next five years and how you'll use the funds. Specify if you want debt or equity financing.",
            "financial projections": "Include financial forecasts for the next 3-5 years. For existing businesses, include income statements, balance sheets, and cash flow statements for the past 3-5 years.",
            "appendix": "The Appendix contains supporting documents referenced throughout your business plan, such as market research, licenses, permits, contracts, etc."
        };
        
        addMessage(guidance[section], 'bot');
    }
    
    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    exportBtn.addEventListener('click', function() {
        const businessName = document.getElementById('business-name').value;
        const industry = document.getElementById('industry').value;
        const stage = document.getElementById('stage').value;
        
        if (!businessName || !industry || !stage) {
            addMessage("Please fill in all the required fields in the sidebar (Business Name, Industry, and Business Stage) before generating your report.", 'bot');
            return;
        }
        
        if (!currentTemplate) {
            addMessage("Please select a business plan template from the sidebar before generating your report.", 'bot');
            return;
        }
        
        // Initialize business plan if not already done
        if (Object.keys(currentBusinessPlan).length === 0) {
            currentBusinessPlan = {
                name: businessName,
                industry: industry,
                stage: stage,
                template: currentTemplate,
                sections: {}
            };
        }

        // If executive summary is not provided, ask for it
        if (!currentBusinessPlan.sections['executive summary']) {
            addMessage("Before generating the report, please provide the Executive Summary for your business plan. This should include a brief overview of your business, its goals, and what makes it unique.", 'bot');
            return;
        }
        
        generateReport();
        addMessage("Your business plan report has been generated! You can view it now and download it as a PDF.", 'bot');
    });
    
    templateOptions.forEach(template => {
        template.addEventListener('click', function() {
            const templateType = this.getAttribute('data-template');
            currentTemplate = templateType;
            
            // Visual feedback for selection
            templateOptions.forEach(t => t.style.backgroundColor = '');
            this.style.backgroundColor = '#dbeafe';
            
            const templateNames = {
                'standard': 'Standard Business Plan',
                'lean': 'Lean Business Plan',
                'investor': 'Investor Pitch Plan'
            };
            
            addMessage(`You've selected the ${templateNames[templateType]}. ${getTemplateDescription(templateType)}`, 'bot');
            
            // Add a follow-up message about starting the business plan
            setTimeout(() => {
                addMessage("Would you like to start creating your business plan now?", 'bot');
            }, 1000);
        });
    });
    
    // Get template description
    function getTemplateDescription(template) {
        const descriptions = {
            'standard': 'This is a comprehensive business plan that covers all standard sections needed for a complete business strategy document.',
            'lean': 'This is a shorter, more focused plan that highlights only the most critical aspects of your business.',
            'investor': 'This plan is specifically designed to appeal to potential investors, with a focus on market opportunity, business model, and financial projections.'
        };
        
        return descriptions[template];
    }
    
    // Add event listeners for export page buttons
    document.getElementById('back-to-chat').addEventListener('click', function() {
        document.getElementById('export-page').style.display = 'none';
        document.querySelector('main').style.display = 'flex';
    });

    document.getElementById('download-report').addEventListener('click', function() {
        generatePDF();
    });

    // Add report page elements
    const reportPage = document.getElementById('report-page');
    const mainContent = document.querySelector('main');
    const backToChatBtn = document.getElementById('back-to-chat');
    const downloadReportBtn = document.getElementById('download-report');

    // Add function to generate and display report
    function generateReport() {
        const businessName = document.getElementById('business-name').value;
        const industry = document.getElementById('industry').value;
        const stage = document.getElementById('stage').value;

        // Hide main content and show report page
        mainContent.style.display = 'none';
        reportPage.style.display = 'block';

        // Generate report content
        const reportContent = document.getElementById('report-content');
        reportContent.innerHTML = `
            <div class="report-section">
                <h3>Business Details</h3>
                <div class="report-content">
                    <p><strong>Business Name:</strong> ${businessName || 'Not specified'}</p>
                    <p><strong>Industry:</strong> ${industry || 'Not specified'}</p>
                    <p><strong>Business Stage:</strong> ${stage || 'Not specified'}</p>
                    <p><strong>Selected Template:</strong> ${currentTemplate || 'Not specified'}</p>
                </div>
            </div>
            <div class="report-section">
                <h3>Executive Summary</h3>
                <div class="report-content">
                    ${currentBusinessPlan.sections['executive summary'] || 'Not provided'}
                </div>
            </div>
            <div class="report-section">
                <h3>Improvement Tips</h3>
                <div class="report-content">
                    ${generateImprovementTips()}
                </div>
            </div>
            <div class="report-section">
                <h3>Summary</h3>
                <div class="report-content">
                    <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        `;
    }

    // Function to generate improvement tips
    function generateImprovementTips() {
        const tips = [
            {
                title: "Market Research",
                content: "Consider conducting more detailed market research to better understand your target audience and competitors."
            },
            {
                title: "Financial Planning",
                content: "Develop more detailed financial projections including revenue streams, expenses, and break-even analysis."
            },
            {
                title: "Marketing Strategy",
                content: "Create a comprehensive marketing plan with specific channels, tactics, and timelines."
            },
            {
                title: "Risk Assessment",
                content: "Identify potential risks and develop mitigation strategies for your business."
            },
            {
                title: "Team Structure",
                content: "Define clear roles and responsibilities for your team members and management structure."
            }
        ];

        return tips.map(tip => `
            <div class="tip-item">
                <div class="tip-icon">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <div class="tip-content">
                    <h4>${tip.title}</h4>
                    <p>${tip.content}</p>
                </div>
            </div>
        `).join('');
    }

    // Add event listeners for report page buttons
    backToChatBtn.addEventListener('click', function() {
        reportPage.style.display = 'none';
        mainContent.style.display = 'flex';
    });

    downloadReportBtn.addEventListener('click', function() {
        generatePDF();
    });
}); 