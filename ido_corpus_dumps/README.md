# Ido Language Corpus - Wikimedia Dumps

This directory contains XML dumps from Wikimedia projects containing Ido language content to help increase the Ido language corpus.

## Downloaded Files

### 1. Ido Wikipedia (iowiki)

- **File**: `iowiki-20251101-pages-articles.xml.bz2`
- **Size**: 21 MB (compressed)
- **Date**: November 1, 2025
- **Source**: https://dumps.wikimedia.org/iowiki/20251101/
- **Content**: Articles, templates, media/file descriptions from Ido Wikipedia (io.wikipedia.org)

### 2. Multilingual Wikisource (sourceswiki)

- **File**: `sourceswiki-latest-pages-articles.xml.bz2`
- **Size**: 158 MB (compressed)
- **Date**: November 2, 2025 (latest dump)
- **Source**: https://dumps.wikimedia.org/sourceswiki/latest/
- **Content**: All articles from multilingual Wikisource (wikisource.org), which includes **1,702 Ido pages**
- **Note**: This dump contains content in many languages. You'll need to filter for Ido content specifically.

## How to Extract the Dumps

### Basic Extraction

To decompress and extract the XML files:

```bash
# Extract Ido Wikipedia
bunzip2 -c iowiki-20251101-pages-articles.xml.bz2 > iowiki-pages-articles.xml

# Extract multilingual Wikisource
bunzip2 -c sourceswiki-latest-pages-articles.xml.bz2 > sourceswiki-pages-articles.xml
```

### Using WikiExtractor

Install [WikiExtractor](https://github.com/attardi/wikiextractor):

```bash
pip install wikiextractor
```

Extract plain text from the dumps:

```bash
# Extract Ido Wikipedia articles
python -m wikiextractor.WikiExtractor -o extracted_iowiki --json iowiki-20251101-pages-articles.xml.bz2

# Extract all Wikisource articles (includes all languages)
python -m wikiextractor.WikiExtractor -o extracted_wikisource --json sourceswiki-latest-pages-articles.xml.bz2
```

## Filtering Ido Content from Wikisource

The multilingual Wikisource contains content in many languages. To filter only Ido content, you can:

### Method 1: Using Python and XML parsing

```python
import bz2
import xml.etree.ElementTree as ET

def extract_ido_pages(dump_file):
    with bz2.open(dump_file, 'rt', encoding='utf-8') as f:
        context = ET.iterparse(f, events=('start', 'end'))
        for event, elem in context:
            if event == 'end' and elem.tag.endswith('page'):
                title = elem.find('.//{*}title')
                text = elem.find('.//{*}text')

                # Check if page is in Ido subdomain or has Ido category
                if title is not None and text is not None:
                    title_text = title.text or ''
                    page_text = text.text or ''

                    # Filter for pages with Ido indicators
                    if ('Ido' in title_text or
                        '[[Category:Id Ido' in page_text or
                        '{{Language|io}}' in page_text):
                        yield title_text, page_text

                elem.clear()

# Usage
for title, content in extract_ido_pages('sourceswiki-latest-pages-articles.xml.bz2'):
    print(f"Title: {title}")
    # Process content...
```

### Method 2: Using grep with decompressed file

```bash
# Decompress first (warning: large file ~1-2GB uncompressed)
bunzip2 sourceswiki-latest-pages-articles.xml.bz2

# Search for Ido-related content
grep -B5 -A20 "Category:Id Ido" sourceswiki-latest-pages-articles.xml > ido_pages.xml
```

## Ido Content Statistics

Based on the Wikisource main page (https://wikisource.org/wiki/Main_Page/Ido):

- **Total Ido pages in Wikisource**: 1,702 pages
- **Notable works available in Ido**:
  - Don Quijote
  - Aeneis
  - Atlantida
  - Kanto di Mea Cid
  - La Azura Groto
  - And many more literary works and documents

## Processing the Data for NLP

To create a clean text corpus for language models or linguistic analysis:

### Using wiki-dump-extractor

```bash
pip install wiki-dump-extractor

# For Ido Wikipedia
from wiki_dump_extractor import WikiDumpExtractor

extractor = WikiDumpExtractor(file_path="iowiki-20251101-pages-articles.xml.bz2")
for page in extractor.iter_pages():
    print(f"Title: {page.title}")
    print(f"Text: {page.text[:200]}...")  # First 200 characters
```

### Cleaning MediaWiki Markup

The extracted text will still contain some MediaWiki markup. You can use libraries like:

- **mwparserfromhell**: Parse and clean MediaWiki markup
- **wikitextparser**: Another MediaWiki parser

```bash
pip install mwparserfromhell

python
import mwparserfromhell

def clean_wikitext(text):
    wikicode = mwparserfromhell.parse(text)
    return wikicode.strip_code()
```

## Additional Resources

### Ido Language Resources

- **Ido Wikipedia**: https://io.wikipedia.org/
- **Ido Wikisource**: https://wikisource.org/wiki/Main_Page/Ido
- **Complete Ido Grammar**: http://www.ido-france.ovh/KGD/tabelo-di-kontenajo.htm
- **Uniono por la Linguo Internaciona Ido (ULI)**: http://www.ido.li

### Wikimedia Dumps

- **All dumps**: https://dumps.wikimedia.org/
- **Dump documentation**: https://meta.wikimedia.org/wiki/Data_dumps
- **Mailing list for dump updates**: https://lists.wikimedia.org/mailman/listinfo/xmldatadumps-l

### Alternative: Hugging Face Datasets

You can also check the Hugging Face Wikisource dataset which may have pre-processed Ido content:

- https://huggingface.co/datasets/wikimedia/wikisource

## License

All content from Wikimedia projects is licensed under:

- **Creative Commons Attribution-ShareAlike License** (CC BY-SA)
- Additional terms may apply. See: https://dumps.wikimedia.org/legal.html

## Checksum Verification

To verify the integrity of the downloaded files:

```bash
# Download and check MD5 checksums
wget https://dumps.wikimedia.org/iowiki/20251101/iowiki-20251101-md5sums.txt
wget https://dumps.wikimedia.org/sourceswiki/latest/sourceswiki-latest-md5sums.txt

# Verify checksums
md5sum -c iowiki-20251101-md5sums.txt | grep "pages-articles.xml.bz2"
md5sum -c sourceswiki-latest-md5sums.txt | grep "pages-articles.xml.bz2"
```

## Next Steps

1. Extract the dumps using one of the methods above
2. Filter Ido content from the multilingual Wikisource dump
3. Clean and normalize the text data
4. Combine both sources to create a comprehensive Ido corpus
5. Use the corpus for:
   - Training language models
   - Linguistic research
   - NLP applications
   - Machine translation
   - Dictionary/vocabulary building

## Contact

For questions about the Ido language or to contribute:

- Visit the Ido community at https://io.wikipedia.org/
- Join discussions at http://www.ido.li
