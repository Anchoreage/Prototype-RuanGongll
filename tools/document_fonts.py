"""Apply the document's Chinese/Latin font pair without changing its content."""
from pathlib import Path
from zipfile import ZipFile
from lxml import etree

CJK_FONT = 'Microsoft YaHei'
LATIN_FONT = 'Times New Roman'
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'


def apply_to_rpr(rpr):
    fonts = rpr.find(f'{{{W}}}rFonts')
    if fonts is None:
        fonts = etree.Element(f'{{{W}}}rFonts')
        # rStyle must precede rFonts in a run's property sequence.
        rstyle = rpr.find(f'{{{W}}}rStyle')
        rpr.insert(1 if rstyle is not None else 0, fonts)
    for attr in list(fonts.attrib):
        if etree.QName(attr).localname.lower().endswith('theme'):
            del fonts.attrib[attr]
    for attr, value in [('ascii', LATIN_FONT), ('hAnsi', LATIN_FONT),
                        ('cs', LATIN_FONT), ('eastAsia', CJK_FONT)]:
        fonts.set(f'{{{W}}}{attr}', value)


def rewrite_docx(path, diagram=None):
    path = Path(path)
    with ZipFile(path) as archive:
        entries = [(info, archive.read(info.filename)) for info in archive.infolist()]
    updated = []
    for info, data in entries:
        name = info.filename
        if name.startswith('word/') and name.endswith('.xml'):
            root = etree.fromstring(data)
            # Covers body text, tables, footers, field results and all styles.
            for run in root.iter(f'{{{W}}}r'):
                rpr = run.find(f'{{{W}}}rPr')
                if rpr is None:
                    rpr = etree.Element(f'{{{W}}}rPr')
                    run.insert(0, rpr)
                apply_to_rpr(rpr)
            for rpr in list(root.iter(f'{{{W}}}rPr')):
                apply_to_rpr(rpr)
            for fonts in root.iter(f'{{{W}}}rFonts'):
                apply_to_rpr(fonts.getparent())
            if name.endswith(('styles.xml', 'stylesWithEffects.xml')):
                for style in root.iter(f'{{{W}}}style'):
                    if style.get(f'{{{W}}}type') in ('paragraph', 'character', 'table'):
                        rpr = style.find(f'{{{W}}}rPr')
                        if rpr is None:
                            rpr = etree.SubElement(style, f'{{{W}}}rPr')
                        apply_to_rpr(rpr)
            if name == 'word/fontTable.xml':
                names = {f.get(f'{{{W}}}name') for f in root}
                for face in (CJK_FONT, LATIN_FONT):
                    if face not in names:
                        item = etree.SubElement(root, f'{{{W}}}font')
                        item.set(f'{{{W}}}name', face)
            if name.startswith('word/theme/'):
                for scheme in root.iter(f'{{{A}}}fontScheme'):
                    for fontset in scheme:
                        for entry in fontset:
                            tag = etree.QName(entry).localname
                            if tag in ('latin', 'cs'):
                                entry.set('typeface', LATIN_FONT)
                            elif tag == 'ea' or (tag == 'font' and entry.get('script') in ('Hans', 'Hant')):
                                entry.set('typeface', CJK_FONT)
            data = etree.tostring(root, encoding='UTF-8', xml_declaration=True, standalone=True)
        elif diagram is not None and name == 'word/media/image1.png':
            data = Path(diagram).read_bytes()
        updated.append((info, data))
    temporary = path.with_name(path.name + '.tmp')
    with ZipFile(temporary, 'w') as archive:
        for info, data in updated:
            archive.writestr(info, data)
    temporary.replace(path)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('path')
    parser.add_argument('--diagram')
    args = parser.parse_args()
    rewrite_docx(args.path, args.diagram)
