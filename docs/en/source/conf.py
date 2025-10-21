# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

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
    'sphinx_markdown_tables',
    'sphinx.ext.mathjax',
]

myst_enable_extensions = [
    "dollarmath",  # enables $...$ and $$...$$
    "amsmath",
]

templates_path = ['_templates']
exclude_patterns = []



# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_book_theme'
html_logo = "_static/logo.png"
html_title = "DLP3D.AI Documentation"
html_theme_options = {
    "repository_url": "https://github.com/dlp3d-ai/dlp3d.ai",
    "use_repository_button": True,
    "show_toc_level": 2,
}
html_static_path = ['_static']
