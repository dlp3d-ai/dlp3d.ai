import os

# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

language = os.environ.get('READTHEDOCS_LANGUAGE', 'en')

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'dlp3d.ai'
copyright = '2025, dlp3d.ai'
author = 'dlp3d.ai'
release = 'v2.0'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    'myst_parser',
    'sphinx_design',
    'sphinx_markdown_tables',
    'sphinx.ext.mathjax',
]

myst_enable_extensions = [
    "colon_fence",
    "dollarmath",  # enables $...$ and $$...$$
    "amsmath",
]

templates_path = ['_templates']
exclude_patterns = ['_subrepos_index.md']

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_book_theme'
html_logo = "_static/logo.png"
html_title = "DLP3D.AI Documentation"
html_theme_options = {
    "home_page_in_toc": True,
    "repository_url": "https://github.com/dlp3d-ai/dlp3d.ai",
    "use_repository_button": True,
    "use_issues_button": True,
    "show_toc_level": 2,
}
html_static_path = ['_static']

def index_subrepos(language: str = 'en'):
    NAME_MAPPING = {
        'MotionDataViewer': 'Motion Data Viewer',
        'orchestrator': 'Orchestrator',
        'web_backend': 'Web Backend',
        'speech2motion': 'Speech2Motion',
        'audio2face': 'Audio2Face',
    } 
    out_file = os.path.join(os.path.dirname(__file__), language, '_subrepos_index.md')
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    
    current_content = []
    success_list = []
    failed_list = []
    
    for repo_name, caption in NAME_MAPPING.items():
        subrepo_index_path = f'_subrepos/{repo_name}/docs/{language}/index.md'
        print(subrepo_index_path)
        if not os.path.exists(subrepo_index_path):
            print(f"📘 {repo_name} index file not found")
            failed_list.append(repo_name)
            continue
        
        current_content.append("```{toctree}")
        current_content.append(":hidden:")
        current_content.append(f":caption: {caption}")
        current_content.append(":maxdepth: 2")
        current_content.append(f"_subrepos/{repo_name}/index.md")
        current_content.append("```")
        success_list.append(repo_name)
    
    new_content = "\n".join(current_content) + "\n"
    
    if os.path.exists(out_file):
        with open(out_file, 'r', encoding='utf-8') as f:
            existing_content = f.read()
        if existing_content == new_content:
            print(f"📘 {out_file} content unchanged, skipping rewrite")
            return
    
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"📘 Generated {len(success_list)} subrepo entries in {out_file}")

index_subrepos(language)
