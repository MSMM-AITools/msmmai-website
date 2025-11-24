// Form field configurations based on CATEGORY

const CATEGORY_FIELDS = {
    'Pursuits': [
        'TITLE',
        'ORG_ID',
        'PRIME',
        'SUB',
        'STATUS',
        'STAGE',
        'DETAILS',
        'EXPECTED_DUE_DATE',
        'SELECTION_CHANCE',
        'PROJECTED_AMOUNT',
        'COMPANY_POC',
        'EXTERNAL_POC',
        'CATEGORY',
        'ARCHIVE'
    ],
    'Proposal Submitted': [
        'TITLE',
        'ORG_ID',
        'PRIME',
        'SUB',
        'STATUS',
        'STAGE',
        'DETAILS',
        'SUBMITED_DATE',
        'EXPECTED_DUE_DATE',
        'PROJECTED_AMOUNT',
        'SELECTION_CHANCE',
        'COMPANY_POC',
        'EXTERNAL_POC',
        'CATEGORY',
        'ARCHIVE',
        'CLIENT_CONTRACT_NO',
        'COMPANY_CONTRACT_NO',
        'CONTRACT_EXP_DATE',
        'COMPANY_CAPACITY',
        'AWARD_NUMBER',
        'POOL'
    ],
    'Fee Proposal': [
        'TITLE',
        'ORG_ID',
        'PRIME',
        'SUB',
        'STATUS',
        'STAGE',
        'DETAILS',
        'EXPECTED_DUE_DATE',
        'SELECTION_CHANCE',
        'PROJECTED_AMOUNT',
        'PROPOSED_SUB_AMOUNT',
        'COMPANY_CAPACITY',
        'CATEGORY',
        'ARCHIVE'
    ]
};

const CATEGORY_DEFAULTS = {
    'Pursuits': { CATEGORY: 'Pursuits', ARCHIVE: 'N' },
    'Proposal Submitted': { CATEGORY: 'Proposal Submitted', ARCHIVE: 'N' },
    'Fee Proposal': { CATEGORY: 'Fee Proposal', ARCHIVE: 'N' }
};

// Field metadata
const FIELD_TYPES = {
    'EXPECTED_DUE_DATE': 'date',
    'SUBMITED_DATE': 'date',
    'CONTRACT_EXP_DATE': 'date',
    'PROJECTED_AMOUNT': 'number',
    'PROPOSED_SUB_AMOUNT': 'number',
    'SELECTION_CHANCE': 'number',
    'DETAILS': 'textarea',
    'ORG_ID': 'select',
    'PRIME': 'select-with-add',
    'SUB': 'select-with-add',
    'STATUS': 'select-with-add',
    'STAGE': 'select-with-add',
    'ARCHIVE': 'select',
    'CATEGORY': 'select'
};

const STATIC_OPTIONS = {
    'ARCHIVE': ['Y', 'N'],
    'CATEGORY': ['Pursuits', 'Proposal Submitted', 'Fee Proposal']
};
