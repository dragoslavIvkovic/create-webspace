# -*- coding: utf-8 -*-
"""Bulk-stamp data-page, i18n.js, lang switch, chrome + service pages. python3 scripts/i18n_apply.py"""

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]

LANG_SWITCH = (
    '            <div class="lang-switch" role="group" data-i18n-aria="c:aria.lang_group">\n'
    '                <button type="button" class="lang-switch__btn lang-switch__btn--flag" data-cwp-lang="sr"'
    ' aria-label="Srpski" data-i18n-aria="c:aria.lang_switch_sr" title="Srpski">\n'
    '                    <span class="lang-switch__flag" aria-hidden="true">🇷🇸</span>\n'
    '                </button>\n'
    '                <button type="button" class="lang-switch__btn lang-switch__btn--flag" data-cwp-lang="en"'
    ' aria-label="Engleski" data-i18n-aria="c:aria.lang_switch_en" title="Engleski">\n'
    '                    <span class="lang-switch__flag" aria-hidden="true">🇬🇧</span>\n'
    '                </button>\n'
    '            </div>\n'
)

SWITCH_MINIMAL = LANG_SWITCH.strip().replace(
    'class="lang-switch"', 'class="lang-switch lang-switch--minimal"', 1
)

SERVICE_STD = frozenset(
    {
        "web-dizajn.html",
        "web-shop.html",
        "seo-optimizacija.html",
        "local-seo.html",
        "geo-optimizacija.html",
        "google-ads.html",
        "google-maps.html",
        "graficki-dizajn.html",
        "digitalni-meni.html",
    }
)


def page_slug(name: str) -> str:
    if name == "index.html":
        return "index"
    if name == "404.html":
        return "404"
    return name[:-5]


def add_body_data_page(html: str, slug: str) -> str:
    def repl(m):
        inner = m.group(1)
        if "data-page=" in inner:
            return m.group(0)
        return "<body%s data-page=\"%s\">" % (inner, slug)

    return re.sub(r"<body\b([^>]*)>", repl, html, count=1)


def insert_lang_switch(html: str) -> str:
    if "lang-switch" in html:
        return html
    i = html.find('<button class="mobile-nav-toggle"')
    if i == -1:
        return html
    return html[:i] + LANG_SWITCH + html[i:]


def insert_i18n_script(html: str) -> str:
    if "i18n.js" in html:
        return html
    m = re.search(r'<script[^>]+cdnjs[^\n]+gsap', html)
    ins = m.start() if m else None
    if ins is None:
        m = re.search(r'<script[^>]*src=["\']script\.js["\']', html)
        ins = m.start() if m else None
    tag = '<script src="i18n.js" defer></script>\n'
    if ins is not None:
        return html[:ins] + tag + html[ins:]
    return html.replace("</head>", '\n    <script src="i18n.js" defer></script>\n</head>', 1)


def rchain(html: str, specs):
    for spec in specs:
        old, new = spec[0], spec[1]
        n = spec[2] if len(spec) > 2 else None
        if n is None:
            html = html.replace(old, new)
        elif n > 0:
            c = pos = 0
            while c < n:
                j = html.find(old, pos)
                if j == -1:
                    break
                html = html[:j] + new + html[j + len(old) :]
                pos = j + len(new)
                c += 1
        else:
            html = html.replace(old, new, abs(n))
    return html


def chrome(html: str) -> str:
    specs = [
        ('<button class="mobile-nav-toggle"', '<button type="button" class="mobile-nav-toggle"'),
        (
            '<button type="button" class="mobile-nav-toggle" aria-label="Menu">',
            '<button type="button" class="mobile-nav-toggle" aria-label="Menu" data-i18n-aria="c:aria.mobile_menu">',
        ),
        (
            '<button class="mobile-nav-toggle" aria-label="Menu">',
            '<button type="button" class="mobile-nav-toggle" aria-label="Menu" data-i18n-aria="c:aria.mobile_menu">',
        ),
        ('<a href="#top">Početna</a>', '<a href="#top" data-i18n="c:nav.home">Početna</a>'),
        ('<a href="index.html">Početna</a>', '<a href="index.html" data-i18n="c:nav.home">Početna</a>'),
        ('<a href="usluge.html" class="active">Usluge</a>', '<a href="usluge.html" class="active" data-i18n="c:nav.services">Usluge</a>'),
        ('<a href="usluge.html">Usluge</a>', '<a href="usluge.html" data-i18n="c:nav.services">Usluge</a>'),
        ('<a href="projekti.html" class="active">Projekti</a>', '<a href="projekti.html" class="active" data-i18n="c:nav.projects">Projekti</a>'),
        ('<a href="projekti.html">Projekti</a>', '<a href="projekti.html" data-i18n="c:nav.projects">Projekti</a>'),
        ('<a href="o-nama.html" class="active">O Nama</a>', '<a href="o-nama.html" class="active" data-i18n="c:nav.about">O Nama</a>'),
        ('<a href="o-nama.html">O Nama</a>', '<a href="o-nama.html" data-i18n="c:nav.about">O Nama</a>'),
        ('<a href="kontakt.html" class="active btn-secondary">Kontakt</a>', '<a href="kontakt.html" class="active btn-secondary" data-i18n="c:nav.contact">Kontakt</a>'),
        ('<a href="kontakt.html" class="btn-secondary">Kontakt</a>', '<a href="kontakt.html" class="btn-secondary" data-i18n="c:nav.contact">Kontakt</a>'),
        ('<a href="kontakt.html">Kontakt</a>', '<a href="kontakt.html" data-i18n="c:nav.contact">Kontakt</a>'),
        ('<a href="web-dizajn.html">Web Dizajn</a>', '<a href="web-dizajn.html" data-i18n="c:dropdown.web_design">Web Dizajn</a>'),
        ('<a href="web-shop.html">Web Shop</a>', '<a href="web-shop.html" data-i18n="c:dropdown.web_shop">Web Shop</a>'),
        ('<a href="seo-optimizacija.html">SEO Optimizacija</a>', '<a href="seo-optimizacija.html" data-i18n="c:dropdown.seo">SEO Optimizacija</a>'),
        ('<a href="local-seo.html">Local SEO</a>', '<a href="local-seo.html" data-i18n="c:dropdown.local_seo">Local SEO</a>'),
        ('<a href="geo-optimizacija.html">Geo Optimizacija</a>', '<a href="geo-optimizacija.html" data-i18n="c:dropdown.geo">Geo Optimizacija</a>'),
        ('<a href="hosting.html">Hosting</a>', '<a href="hosting.html" data-i18n="c:dropdown.hosting">Hosting</a>'),
        ('<a href="google-ads.html">Google Ads</a>', '<a href="google-ads.html" data-i18n="c:dropdown.google_ads">Google Ads</a>'),
        ('<a href="google-maps.html">Google Maps</a>', '<a href="google-maps.html" data-i18n="c:dropdown.google_maps">Google Maps</a>'),
        ('<a href="graficki-dizajn.html">Grafički Dizajn</a>', '<a href="graficki-dizajn.html" data-i18n="c:dropdown.graphic_design">Grafički Dizajn</a>'),
        ('<a href="digitalni-meni.html">Digitalni Meni</a>', '<a href="digitalni-meni.html" data-i18n="c:dropdown.digital_menu">Digitalni Meni</a>'),
        ('<p class="footer-desc">', '<p class="footer-desc" data-i18n="c:footer.lead">'),
        ('<h4>Navigacija</h4>', '<h4 data-i18n="c:footer.nav_heading">Navigacija</h4>'),
        ('<h4>Naše Usluge</h4>', '<h4 data-i18n="c:footer.services_heading">Naše Usluge</h4>'),
        ('<h4>Pratite nas</h4>', '<h4 data-i18n="c:footer.follow_heading">Pratite nas</h4>'),
        ('<h4>Pratite Nas</h4>', '<h4 data-i18n="c:footer.follow_heading">Pratite Nas</h4>'),
        ('<li><a href="web-shop.html">Web Prodavnice</a></li>', '<li><a href="web-shop.html" data-i18n="c:footer.shops">Web Prodavnice</a></li>'),
        ('<p>&copy; 2024 CreateWebPlace. Sva prava zadržana.</p>', '<p data-i18n="c:footer.copyright">&copy; 2024 CreateWebPlace. Sva prava zadržana.</p>'),
        ('<a href="#">Politika Privatnosti</a>', '<a href="#" data-i18n="c:footer.privacy">Politika Privatnosti</a>'),
        ('<a href="#">Uslovi Korišćenja</a>', '<a href="#" data-i18n="c:footer.terms">Uslovi Korišćenja</a>'),
        ('<h3>Započnimo razgovor</h3>', '<h3 data-i18n="c:modal.start_talk">Započnimo razgovor</h3>'),
        ('<p>Izaberite način na koji želite da nas kontaktirate.</p>', '<p data-i18n="c:modal.choose_how">Izaberite način na koji želite da nas kontaktirate.</p>'),
        ('<span>Pozovite nas odmah</span>', '<span data-i18n="c:modal.call_now">Pozovite nas odmah</span>'),
        ('<span>Pošaljite upit mejlom</span>', '<span data-i18n="c:modal.send_email">Pošaljite upit mejlom</span>'),
        ('<button class="back-to-options" id="back-to-options-btn">← Nazad</button>', '<button class="back-to-options" id="back-to-options-btn" data-i18n="c:modal.back">← Nazad</button>'),
        ('<h3>Pošaljite poruku</h3>', '<h3 data-i18n="c:modal.send_title">Pošaljite poruku</h3>'),
        ('<p>Tu smo da odgovorimo na sva vaša pitanja.</p>', '<p data-i18n="c:modal.send_lead">Tu smo da odgovorimo na sva vaša pitanja.</p>'),
        ('<button class="close-modal-btn" id="close-contact-modal">Zatvori</button>', '<button class="close-modal-btn" id="close-contact-modal" data-i18n="c:modal.close">Zatvori</button>'),
    ]
    html = rchain(html, specs)
    html = html.replace('title="Back to top"', 'data-i18n-title="c:aria.scroll_top" title="Back to top"', 9999)
    html = html.replace(
        '<a href="tel:+381111234567" class="contact-icon phone"',
        '<a href="tel:+381111234567" class="contact-icon phone" data-i18n-aria="c:floating.call"',
        999,
    )

    btn_open = '<button class="contact-icon email" id="open-contact-modal"'
    if btn_open in html:
        html = html.replace(btn_open, '<button type="button" class="contact-icon email" id="open-contact-modal" data-i18n-aria="c:floating.contact"', 999)
    btn_open2 = '<button type="button" class="contact-icon email" id="open-contact-modal"'
    html = html.replace(
        btn_open2,
        '<button type="button" class="contact-icon email" id="open-contact-modal" data-i18n-aria="c:floating.contact"',
        999,
    )
    html = html.replace('<a href="kontakt.html" class="contact-icon email"', '<a href="kontakt.html" class="contact-icon email" data-i18n-aria="c:floating.contact"', 999)
    html = re.sub(r'data-i18n-aria="c:floating\.call"\s+data-i18n-aria="c:floating\.call"', 'data-i18n-aria="c:floating.call"', html)
    html = re.sub(r'id="phone-pulse" data-i18n-aria="c:floating\.call"', 'id="phone-pulse"', html)

    dup = '<button type="button" type="button"'
    html = html.replace(dup, '<button type="button"')
    return html


def mark_hero_h1(html: str) -> str:
    ix = html.find('<section class="section page-hero">')
    if ix == -1:
        return html
    iy = html.find("<h1", ix)
    if iy == -1:
        return html
    ig = html.find(">", iy)
    if ig == -1 or 'data-i18n-html="p:hero_h_html"' in html[iy : ig + 1]:
        return html
    return html[:ig] + ' data-i18n-html="p:hero_h_html"' + html[ig:]


def mark_service_standard(html: str) -> str:
    html = re.sub(
        r'(<section class="section page-hero">\s*<div class="container">\s*<span class="subtitle")(>)',
        r'\1 data-i18n="p:hero_k"\2',
        html,
        count=1,
    )
    html = mark_hero_h1(html)
    html = re.sub(
        r'(<section class="section page-hero">[\s\S]*?<p class="hero-subtext")(>)',
        r'\1 data-i18n="p:hero_sub"\2',
        html,
        count=1,
    )
    html = re.sub(r'(<div class="service-detail-text[^>]*">\s*)(<h2)(>)', r'\1\2 data-i18n="p:h2"\3', html, count=1)
    html = re.sub(
        r'(<h2 data-i18n="p:h2">[^<]+</h2>\s*)<p>',
        r'\1<p data-i18n-html="p:intro_html">',
        html,
        count=1,
    )

    for idx in range(1, 4):
        html = re.sub(
            r"(<div class=\"service-detail-text[^>]*>[\s\S]*?)<h3(?![^>]*data-i18n)(\s|>)",
            rf'\1<h3 data-i18n="p:s{idx}_title"\2',
            html,
            count=1,
        )
        html = re.sub(
            rf'(<h3 data-i18n="p:s{idx}_title"[^>]*>[^<]+</h3>\s*)<p(?![^>]*data-i18n-html)(\s|>)',
            rf'\1<p data-i18n-html="p:s{idx}_html"\2',
            html,
            count=1,
        )

    html = html.replace(
        'title="Kontaktirajte nas"',
        'data-i18n-iframetitle="p:iframe" title="Kontaktirajte nas"',
        1,
    )
    return html


def mark_usluge(html: str) -> str:
    html = re.sub(
        r'(<section class="section page-hero">\s*<div class="container">\s*<span class="subtitle")(>)',
        r'\1 data-i18n="p:hero_k"\2',
        html,
        count=1,
    )
    ix = html.find('<section class="section page-hero">')
    if ix != -1:
        iy = html.find('<h1', ix)
        if iy != -1:
            ig = html.find('>', iy)
            if ig != -1 and 'data-i18n-html' not in html[iy : ig + 1]:
                html = html[:ig] + ' data-i18n-html="p:hero_h_html"' + html[ig:]
    html = re.sub(
        r'(<section class="section page-hero">[\s\S]*?<p class="hero-subtext")(>)',
        r'\1 data-i18n="p:hero_p"\2',
        html,
        count=1,
    )
    for i in range(1, 11):
        html = re.sub(
            r'(<div class="service-text-block reveal-up">\s*<h3)(>)',
            rf'\1 data-i18n="p:b{i}_title"\2',
            html,
            count=1,
        )
        html = re.sub(
            rf'(data-i18n="p:b{i}_title"[^>]*>[^<]+</h3>\s*)<p(?![^>]*data-i18n)',
            rf'\1<p data-i18n="p:b{i}_p1"',
            html,
            count=1,
        )
        html = re.sub(
            rf'(data-i18n="p:b{i}_p1"[^>]*>[^<]+</p>\s*)<p(?![^>]*data-i18n)',
            rf'\1<p data-i18n="p:b{i}_p2"',
            html,
            count=1,
        )
        html = re.sub(
            rf'(data-i18n="p:b{i}_p2"[^>]*>[^<]+</p>\s*)<a href=',
            rf'\1<a data-i18n="p:b{i}_cta" href=',
            html,
            count=1,
        )
    html = html.replace(
        '<span class="subtitle">Metodologija</span>',
        '<span class="subtitle" data-i18n="p:proc_k">Metodologija</span>',
        1,
    )
    html = html.replace(
        '<h2>Kako <span class="gradient-text">Radimo?</span></h2>',
        '<h2 data-i18n-html="p:proc_h_html">Kako <span class="gradient-text">Radimo?</span></h2>',
        1,
    )
    html = html.replace(
        '<p>Transparentan i inženjerski precizan proces koji garantuje uspeh vašeg projekta.</p>',
        '<p data-i18n="p:proc_lead">Transparentan i inženjerski precizan proces koji garantuje uspeh vašeg projekta.</p>',
        1,
    )
    for idx in range(1, 5):
        html = re.sub(
            r'(<div class="step-card[^>]*>[\s\S]*?<h4)(>)',
            rf'\1 data-i18n="p:s{idx}_h"\2',
            html,
            count=1,
        )
        html = re.sub(
            rf'(data-i18n="p:s{idx}_h"[^>]*>[^<]+</h4>\s*)(<p)(>)',
            rf'\1\2 data-i18n="p:s{idx}_p"\3',
            html,
            count=1,
        )
    html = html.replace(
        '<span class="subtitle">Pitanja</span>',
        '<span class="subtitle" data-i18n="p:faq_k">Pitanja</span>',
        1,
    )
    html = html.replace(
        '<h2>Česta <br><span class="gradient-text">Pitanja</span></h2>',
        '<h2 data-i18n-html="p:faq_h_html">Česta <br><span class="gradient-text">Pitanja</span></h2>',
        1,
    )
    html = html.replace(
        '<p>Sve što treba da znate o saradnji sa nama na jednom mestu.</p>',
        '<p data-i18n="p:faq_lead">Sve što treba da znate o saradnji sa nama na jednom mestu.</p>',
        1,
    )
    for qk, ak in (
        ("faq1_q", "faq1_a"),
        ("faq2_q", "faq2_a"),
        ("faq3_q", "faq3_a"),
    ):
        html = re.sub(
            r'(<div class="faq-question">\s*<h4)(>)',
            rf'\1 data-i18n="p:{qk}"\2',
            html,
            count=1,
        )
        html = re.sub(
            r'(<div class="faq-answer">\s*<p)(>)',
            rf'\1 data-i18n="p:{ak}"\2',
            html,
            count=1,
        )
    if html.count('<iframe src="https://tally.so/embed'):
        html = html.replace(
            '<iframe src="https://tally.so/embed',
            '<iframe data-i18n-iframetitle="p:iframe_contact" src="https://tally.so/embed',
            1,
        )
    return html


def mark_hosting(html: str) -> str:
    html = re.sub(
        r'(<section class="section page-hero">\s*<div class="container">\s*<span class="subtitle")(>)',
        r'\1 data-i18n="p:hero_k"\2',
        html,
        count=1,
    )
    html = mark_hero_h1(html)
    html = re.sub(
        r'(<section class="section page-hero">[\s\S]*?<p class="hero-subtext")(>)',
        r'\1 data-i18n="p:hero_sub"\2',
        html,
        count=1,
    )
    html = re.sub(
        r'(<div class="text-content reveal-up">\s*<h2)(>)',
        r'\1 data-i18n="p:h2_performance"\2',
        html,
        count=1,
    )
    html = re.sub(
        r'(data-i18n="p:h2_performance"[^>]*>[^<]+</h2>\s*)<p(?![^>]*data-i18n)',
        r'\1<p data-i18n="p:p_perf1"',
        html,
        count=1,
    )
    html = re.sub(
        r'(data-i18n="p:p_perf1"[^>]*>[^<]+</p>\s*)<p(?![^>]*data-i18n)',
        r'\1<p data-i18n="p:p_perf2"',
        html,
        count=1,
    )
    html = re.sub(
        r'(<div class="stat-item">\s*<span class="number"[^>]*>[^<]+</span>[^<]*%\s*<p)(>)',
        r'\1 data-i18n="p:stat_uptime"\2',
        html,
        count=1,
    )
    html = re.sub(
        r'(<div class="stat-item">\s*<span class="number"[^>]*>[^<]+</span>%\s*<p)(>)',
        r'\1 data-i18n="p:stat_ssd"\2',
        html,
        count=1,
    )
    html = re.sub(
        r'(<div class="section-header center reveal-up">\s*<span class="subtitle")(>)',
        r'\1 data-i18n="p:sec_k"\2',
        html,
        count=1,
    )
    html = re.sub(
        r'(<div class="section-header center reveal-up">[\s\S]*?<h2)(>)',
        r'\1 data-i18n="p:sec_h"\2',
        html,
        count=1,
    )
    card_hs = ("card_backup_h", "card_ssl_h", "card_support_h")
    card_ps = ("card_backup_p", "card_ssl_p", "card_support_p")
    for ch, cp in zip(card_hs, card_ps):
        html = re.sub(r'(<div class="sv3-content">\s*<h3)(>)', rf'\1 data-i18n="p:{ch}"\2', html, count=1)
        html = re.sub(
            rf'(data-i18n="p:{ch}"[^>]*>[^<]+</h3>\s*<p)(>)',
            rf'\1 data-i18n="p:{cp}"\2',
            html,
            count=1,
        )
    tally_n = html.count('<iframe src="https://tally.so/embed')
    for _ in range(tally_n):
        html = html.replace(
            '<iframe src="https://tally.so/embed',
            '<iframe data-i18n-iframetitle="p:iframe" src="https://tally.so/embed',
            1,
        )
    return html


def insert_lang_after_body_open(html: str, switch_block: str) -> str:
    if "lang-switch" in html:
        return html

    def repl(m):
        return m.group(0) + "\n    " + switch_block.strip() + "\n"

    return re.sub(r"<body[^>]*>", repl, html, count=1)


def insert_lang_404(html: str) -> str:
    return insert_lang_after_body_open(html, SWITCH_MINIMAL)


def mark_projekti(html: str) -> str:
    html = re.sub(
        r'(<section class="section page-hero">\s*<div class="container">\s*<span class="subtitle")(>)',
        r'\1 data-i18n="p:subtitle"\2',
        html,
        count=1,
    )
    ix = html.find('<section class="section page-hero">')
    if ix != -1:
        iy = html.find('<h1', ix)
        if iy != -1:
            ig = html.find('>', iy)
            if ig != -1 and 'data-i18n-html' not in html[iy : ig + 1]:
                html = html[:ig] + ' data-i18n-html="p:h_html"' + html[ig:]
    html = re.sub(
        r'(<section class="section page-hero">[\s\S]*?<p class="hero-subtext")(>)',
        r'\1 data-i18n="p:lead"\2',
        html,
        count=1,
    )
    html = html.replace(
        '<span class="item-category">LIVE</span>',
        '<span class="item-category" data-i18n="p:live">LIVE</span>',
    )
    html = html.replace(
        '<span class="item-category">APP</span>',
        '<span class="item-category" data-i18n="p:app_tag">APP</span>',
    )
    reps = (
        (
            '<iframe src="https://adaptacijastanova.online/" title="Pregled sajta Adaptacija Stanova"',
            '<iframe src="https://adaptacijastanova.online/" data-i18n-iframetitle="p:adapt_iframe" title="Pregled sajta Adaptacija Stanova"',
        ),
        (
            '<h3>Adaptacija Stanova</h3>',
            '<h3 data-i18n="p:adapt_title">Adaptacija Stanova</h3>',
        ),
        (
            '<p>Remix sajt — Beograd, portfelj i kustoski ton za adaptaciju stanova.</p>',
            '<p data-i18n="p:adapt_sub">Remix sajt — Beograd, portfelj i kustoski ton za adaptaciju stanova.</p>',
        ),
        (
            '<iframe src="https://vodoinstalater.store/" title="Pregled sajta Majstor"',
            '<iframe src="https://vodoinstalater.store/" data-i18n-iframetitle="p:vod_iframe" title="Pregled sajta Majstor"',
        ),
        (
            '<h3>vodoinstalater.store</h3>',
            '<h3 data-i18n="p:vod_title">vodoinstalater.store</h3>',
        ),
        (
            '<p>Glassmorphism landing — majstori, hitne intervencije, ceo Beograd.</p>',
            '<p data-i18n="p:vod_sub">Glassmorphism landing — majstori, hitne intervencije, ceo Beograd.</p>',
        ),
        (
            '<span class="vet-tile-kicker">Pet health</span>',
            '<span class="vet-tile-kicker" data-i18n="p:vet_kicker">Pet health</span>',
        ),
        (
            '<span class="vet-tile-name">Vet Record</span>',
            '<span class="vet-tile-name" data-i18n="p:vet_name_tile">Vet Record</span>',
        ),
        (
            '<h3>Vet Record</h3>',
            '<h3 data-i18n="p:vet_title">Vet Record</h3>',
        ),
        (
            '<p>Pet health tracker — zdravstvena istorija, vakcine, lekovi; iOS i Android.</p>',
            '<p data-i18n="p:vet_sub">Pet health tracker — zdravstvena istorija, vakcine, lekovi; iOS i Android.</p>',
        ),
        (
            '<span class="store-tile-badge">Google Play</span>',
            '<span class="store-tile-badge" data-i18n="p:math_badge">Google Play</span>',
        ),
        (
            '<span class="store-tile-name">School Math Pro</span>',
            '<span class="store-tile-name" data-i18n="p:math_name">School Math Pro</span>',
        ),
        (
            '<h3>School Math Pro</h3>',
            '<h3 data-i18n="p:math_title">School Math Pro</h3>',
        ),
        (
            '<p>SmartSolution — digitalni tutor, matematika korak po korak, bez reklama i distrakcija.</p>',
            '<p data-i18n="p:math_sub">SmartSolution — digitalni tutor, matematika korak po korak, bez reklama i distrakcija.</p>',
        ),
        (
            '<iframe src="https://www.directchinagoods.com/" title="Pregled sajta Direct China Goods"',
            '<iframe src="https://www.directchinagoods.com/" data-i18n-iframetitle="p:dc_iframe" title="Pregled sajta Direct China Goods"',
        ),
        (
            '<h3>Direct China Goods</h3>',
            '<h3 data-i18n="p:dc_title">Direct China Goods</h3>',
        ),
        (
            '<p>Gateway za poslovanje s Kine — B2B i pouzdan pristup tržištu.</p>',
            '<p data-i18n="p:dc_sub">Gateway za poslovanje s Kine — B2B i pouzdan pristup tržištu.</p>',
        ),
    )
    for o, n in reps:
        html = html.replace(o, n, 1)
    return html


def mark_o_nama(html: str) -> str:
    html = re.sub(
        r'(<section class="section page-hero">\s*<div class="container">\s*<span class="subtitle")(>)',
        r'\1 data-i18n="p:hero_k"\2',
        html,
        count=1,
    )
    ix = html.find('<section class="section page-hero">')
    if ix != -1:
        iy = html.find('<h1', ix)
        if iy != -1:
            ig = html.find('>', iy)
            if ig != -1 and 'data-i18n-html' not in html[iy : ig + 1]:
                html = html[:ig] + ' data-i18n-html="p:hero_h_html"' + html[ig:]
    html = re.sub(
        r'(<section class="section page-hero">[\s\S]*?<p class="hero-subtext")(>)',
        r'\1 data-i18n="p:lead"\2',
        html,
        count=1,
    )
    html = html.replace(
        '<h2>Ko smo mi?</h2>',
        '<h2 data-i18n="p:h2_who">Ko smo mi?</h2>',
        1,
    )
    html = html.replace(
        '<p>CreateWebPlace je multidisciplinarna digitalna agencija sa sedištem u Beogradu. Naš tim čine iskusni inženjeri, dizajneri i stratezi koji veruju da tehnologija treba da bude nevidljiva podrška vrhunskom korisničkom iskustvu.</p>',
        '<p data-i18n="p:p1">CreateWebPlace je multidisciplinarna digitalna agencija sa sedištem u Beogradu. Naš tim čine iskusni inženjeri, dizajneri i stratezi koji veruju da tehnologija treba da bude nevidljiva podrška vrhunskom korisničkom iskustvu.</p>',
        1,
    )
    html = html.replace(
        '<p>Ne pravimo samo kod. Mi rešavamo poslovne probleme kroz inovativne digitalne arhitekture.</p>',
        '<p data-i18n="p:p2">Ne pravimo samo kod. Mi rešavamo poslovne probleme kroz inovativne digitalne arhitekture.</p>',
        1,
    )
    html = html.replace(
        '<li>Integritet u svakom pikselu</li>',
        '<li data-i18n="p:li1">Integritet u svakom pikselu</li>',
        1,
    )
    html = html.replace(
        '<li>Brzina kao imperativ</li>',
        '<li data-i18n="p:li2">Brzina kao imperativ</li>',
        1,
    )
    html = html.replace(
        '<li>Dizajn vođen konverzijom</li>',
        '<li data-i18n="p:li3">Dizajn vođen konverzijom</li>',
        1,
    )
    stat_keys = ("stat1", "stat2", "stat3", "stat4")
    for sk in stat_keys:
        html = re.sub(
            r'(<div class="stat-item">\s*<span class="number"[^>]*>[^<]+</span>\s*<p)(>)',
            rf'\1 data-i18n="p:{sk}"\2',
            html,
            count=1,
        )
    return html


def mark_kontakt(html: str) -> str:
    html = re.sub(
        r"<iframe(?![^>]*data-i18n-iframetitle)(\s[^>]*src=\"https://tally\.so/embed)",
        r'<iframe data-i18n-iframetitle="p:iframe_title"\1',
        html,
    )
    return html


def mark_404_main(html: str) -> str:
    html = html.replace(
        '<h1>Ups! Izgleda da ste se izgubili.</h1>',
        '<h1 data-i18n="p:h1">Ups! Izgleda da ste se izgubili.</h1>',
        1,
    )
    html = html.replace(
        """        <p class="error-page__lead">
            Stranica koju tražite ne postoji ili je premeštena na drugu lokaciju.
        </p>""",
        """        <p class="error-page__lead" data-i18n="p:lead">
            Stranica koju tražite ne postoji ili je premeštena na drugu lokaciju.
        </p>""",
        1,
    )
    html = html.replace(
        '<a href="index.html" class="btn-primary">Vrati se na početnu</a>',
        '<a href="index.html" class="btn-primary" data-i18n="p:cta">Vrati se na početnu</a>',
        1,
    )
    return html


def mark_index(html: str) -> str:
    idx_specs = [
        (
            'alt="Background" class="hero-bg-img"',
            'data-i18n-alt="p:hero.img_alt_bg" alt="Background" class="hero-bg-img"',
        ),
        (
            '<h1 class="reveal-text">Sajtovi i online prodavnice za savremeno tržište.</h1>',
            '<h1 class="reveal-text" data-i18n="p:hero.h1">Sajtovi i online prodavnice za savremeno tržište.</h1>',
        ),
        (
            '<a href="kontakt.html" class="btn-primary hero-btn">Započnimo Projekat</a>',
            '<a href="kontakt.html" class="btn-primary hero-btn" data-i18n="p:hero.cta_primary">Započnimo Projekat</a>',
        ),
        (
            '<a href="#portfolio" class="btn-outline hero-btn-outline">Naši Radovi</a>',
            '<a href="#portfolio" class="btn-outline hero-btn-outline" data-i18n="p:hero.cta_outline">Naši Radovi</a>',
        ),
        (
            '<span class="subtitle" style="color: #FF8359;">Specijalizacija</span>',
            '<span class="subtitle" style="color: #FF8359;" data-i18n="p:services.kicker">Specijalizacija</span>',
        ),
        ('<h2>Digitalna rešenja koja nudimo</h2>', '<h2 data-i18n="p:services.h2">Digitalna rešenja koja nudimo</h2>', 1),
        (
            '<h3>Sajtovi i enterprise platforme</h3>',
            '<h3 data-i18n="p:services.card1_title">Sajtovi i enterprise platforme</h3>',
        ),
        (
            '<p>Robusna arhitektura, brzo učitavanje i jasna navigacija — da klijent odmah kapira ponudu.</p>',
            '<p data-i18n="p:services.card1_p">Robusna arhitektura, brzo učitavanje i jasna navigacija — da klijent odmah kapira ponudu.</p>',
            1,
        ),
        (
            'alt="Rad na razvoju web platformi na laptopu"',
            'data-i18n-alt="p:services.card1_alt" alt="Rad na razvoju web platformi na laptopu"',
        ),
        (
            '<a href="usluge.html" class="text-link">Kompletna ponuda razvoja &raquo;</a>',
            '<a href="usluge.html" class="text-link" data-i18n="p:services.card1_link">Kompletna ponuda razvoja &raquo;</a>',
            1,
        ),
        ('<h3>Mobilne aplikacije i UI/UX</h3>', '<h3 data-i18n="p:services.card2_title">Mobilne aplikacije i UI/UX</h3>', 1),
        (
            '<p>iOS i Android uz interfejs koji prati vaš brend — manje koraka do konverzije, više jasnoće za korisnika.</p>',
            '<p data-i18n="p:services.card2_p">iOS i Android uz interfejs koji prati vaš brend — manje koraka do konverzije, više jasnoće za korisnika.</p>',
            1,
        ),
        (
            'alt="Mobilni telefon — aplikacije i UX u upotrebi"',
            'data-i18n-alt="p:services.card2_alt" alt="Mobilni telefon — aplikacije i UX u upotrebi"',
        ),
        (
            '<a href="web-dizajn.html" class="text-link">Više o dizajn pristupu &raquo;</a>',
            '<a href="web-dizajn.html" class="text-link" data-i18n="p:services.card2_link">Više o dizajn pristupu &raquo;</a>',
            1,
        ),
        (
            '<p>Čitav spektar usluga jednim klikom — <strong>strateški raspored šta ima smisla prvo</strong>. <a href="usluge.html" class="sv3-link-inline">Pregled svega što radimo</a></p>',
            '<p><span data-i18n="p:services.footer_p_intro">Čitav spektar usluga jednim klikom — </span>'
            '<strong data-i18n="p:services.footer_p_mid">strateški raspored šta ima smisla prvo</strong>. '
            '<a href="usluge.html" class="sv3-link-inline" data-i18n="p:services.footer_link">Pregled svega što radimo</a></p>',
            1,
        ),
        (
            '<span class="subtitle gb-profile-section__subtitle">Google i lokal</span>',
            '<span class="subtitle gb-profile-section__subtitle" data-i18n="p:gb.subtitle">Google i lokal</span>',
            1,
        ),
        (
            '<h2>Istaknite firmu na Google Pretrazi i Google Kartama</h2>',
            '<h2 data-i18n="p:gb.h2">Istaknite firmu na Google Pretrazi i Google Kartama</h2>',
            1,
        ),
        (
            '<p class="gb-profile-card__kicker">Profil na Google‑u</p>',
            '<p class="gb-profile-card__kicker" data-i18n="p:gb.card1_kicker">Profil na Google‑u</p>',
            1,
        ),
        (
            '<h3 class="gb-profile-card__title">Pretraga i Karte koje donose upite</h3>',
            '<h3 class="gb-profile-card__title" data-i18n="p:gb.card1_title">Pretraga i Karte koje donose upite</h3>',
            1,
        ),
        (
            '<p class="gb-profile-card__text">Pomažemo firmama i majstorima da <strong>profesionalno postave i vode '
            'poslovni profil</strong> (Google Business Profile): tačne kategorije, radna zona, vizuelni materijal i '
            'tekstovi koji vuku pozive iz pretrage — ne prazan broj pregleda.</p>',
            '<p class="gb-profile-card__text" data-i18n-html="p:gb.card1_html">Pomažemo firmama i majstorima da '
            '<strong>profesionalno postave i vode poslovni profil</strong> (Google Business Profile): tačne '
            'kategorije, radna zona, vizuelni materijal i tekstovi koji vuku pozive iz pretrage — ne prazan broj pregleda.</p>',
            1,
        ),
        (
            '<li>Istaknuto mesto u „Maps“ i pojmovi kojima stvarno konkurišete (npr. „u blizini“, naziv usluge).</li>',
            '<li data-i18n="p:gb.card1_li1">Istaknuto mesto u „Maps“ i pojmovi kojima stvarno konkurišete (npr. „u blizini“, naziv usluge).</li>',
            1,
        ),
        (
            '<li>Spoj sa vašim sajtom i Local SEO kada budete spremni na širi domet.</li>',
            '<li data-i18n="p:gb.card1_li2">Spoj sa vašim sajtom i Local SEO kada budete spremni na širi domet.</li>',
            1,
        ),
        (
            '<a href="local-seo.html" class="text-link">Lokalna strategija i profil — detaljnije &raquo;</a>',
            '<a href="local-seo.html" class="text-link" data-i18n="p:gb.link_local">Lokalna strategija i profil — detaljnije &raquo;</a>',
            1,
        ),
        (
            '<p class="gb-profile-card__kicker">Šta klijent vidi prvo</p>',
            '<p class="gb-profile-card__kicker" data-i18n="p:gb.card2_kicker">Šta klijent vidi prvo</p>',
            1,
        ),
        (
            '<h3 class="gb-profile-card__title">Poverenje pre prvog klika na sajt</h3>',
            '<h3 class="gb-profile-card__title" data-i18n="p:gb.card2_title">Poverenje pre prvog klika na sajt</h3>',
            1,
        ),
        (
            '<p class="gb-profile-card__text"><strong>Poslovni profil</strong> je često prva kartica koju vide pre sajta: sati, telefon, lokacija, ponuda, recenzije — tu se gubi ili dobija poverenje. Uređujemo i održavamo taj prikaz uz jasnu poruku i trag na šta konkretno reaguju ljudi.</p>',
            '<p class="gb-profile-card__text" data-i18n-html="p:gb.card2_html"><strong>Poslovni profil</strong> je često prva kartica koju vide pre sajta: sati, telefon, lokacija, ponuda, recenzije — tu se gubi ili dobija poverenje. Uređujemo i održavamo taj prikaz uz jasnu poruku i trag na šta konkretno reaguju ljudi.</p>',
            1,
        ),
        (
            '<li>Recenzije i odgovori koji grade ugled — ne statistika radi brojki.</li>',
            '<li data-i18n="p:gb.card2_li1">Recenzije i odgovori koji grade ugled — ne statistika radi brojki.</li>',
            1,
        ),
        (
            '<li>Fotografije i opis usluge kao završen prikaz, ne kopirani šablon.</li>',
            '<li data-i18n="p:gb.card2_li2">Fotografije i opis usluge kao završen prikaz, ne kopirani šablon.</li>',
            1,
        ),
        (
            '<a href="google-maps.html" class="text-link gb-profile-card__link-secondary">Google Karte za biznis — šta sve ulazi &raquo;</a>',
            '<a href="google-maps.html" class="text-link gb-profile-card__link-secondary" data-i18n="p:gb.link_maps">Google Karte za biznis — šta sve ulazi &raquo;</a>',
            1,
        ),
        ('<span class="gb-profile-card__chip">Maps</span>', '<span class="gb-profile-card__chip" data-i18n="p:gb.chip_maps">Maps</span>', 1),
        (
            '<span class="gb-profile-card__chip">Pretraga</span>',
            '<span class="gb-profile-card__chip" data-i18n="p:gb.chip_search">Pretraga</span>',
            1,
        ),
        (
            '<span class="gb-profile-card__chip">Recenzije</span>',
            '<span class="gb-profile-card__chip" data-i18n="p:gb.chip_reviews">Recenzije</span>',
            1,
        ),
        (
            '<span class="gb-profile-card__chip">Radno vreme</span>',
            '<span class="gb-profile-card__chip" data-i18n="p:gb.chip_hours">Radno vreme</span>',
            1,
        ),
        ('<span class="gb-profile-card__chip">Foto</span>', '<span class="gb-profile-card__chip" data-i18n="p:gb.chip_photo">Foto</span>', 1),
    ]
    html = rchain(html, idx_specs)

    mq = (
        ('<span class="services-marquee__word">SEO</span>', '<span class="services-marquee__word" data-i18n="c:mq.seo">SEO</span>'),
        (
            '<span class="services-marquee__word">Web sajto</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.web">Web sajto</span>',
        ),
        (
            '<span class="services-marquee__word">Mobilne aplikacije</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.apps">Mobilne aplikacije</span>',
        ),
        (
            '<span class="services-marquee__word">E‑commerce</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.commerce">E‑commerce</span>',
        ),
        (
            '<span class="services-marquee__word">Google Ads</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.ads">Google Ads</span>',
        ),
        (
            '<span class="services-marquee__word">Local SEO</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.localseo">Local SEO</span>',
        ),
        (
            '<span class="services-marquee__word">Hosting</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.hosting">Hosting</span>',
        ),
        (
            '<span class="services-marquee__word">Web dizajn</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.design">Web dizajn</span>',
        ),
        (
            '<span class="services-marquee__word">Grafički dizajn</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.graphic">Grafički dizajn</span>',
        ),
        (
            '<span class="services-marquee__word">Sajt</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.site">Sajt</span>',
        ),
        (
            '<span class="services-marquee__word">Performanse</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.perf">Performanse</span>',
        ),
        (
            '<span class="services-marquee__word">Brend</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.brand">Brend</span>',
        ),
        (
            '<span class="services-marquee__word">UX / UI</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.ux">UX / UI</span>',
        ),
        (
            '<span class="services-marquee__word">Google Maps</span>',
            '<span class="services-marquee__word" data-i18n="c:mq.maps">Google Maps</span>',
        ),
    )
    for o, n in mq:
        html = html.replace(o, n)

    tail_specs = [
        (
            '<span class="subtitle">Portfolio</span>',
            '<span class="subtitle" data-i18n="p:portfolio.subtitle">Portfolio</span>',
            1,
        ),
        ('<h2>Odabrani Radovi</h2>', '<h2 data-i18n="p:portfolio.h2">Odabrani Radovi</h2>', 1),
        (
            '<a href="projekti.html" class="sv3-link">Svi projekti</a>',
            '<a href="projekti.html" class="sv3-link" data-i18n="p:portfolio.all_link">Svi projekti</a>',
            1,
        ),
        (
            '<iframe src="https://adaptacijastanova.online/" title="Pregled sajta Adaptacija Stanova"',
            '<iframe src="https://adaptacijastanova.online/" data-i18n-iframetitle="p:portfolio.adapt_iframe" title="Pregled sajta Adaptacija Stanova"',
            1,
        ),
        ('<h3>Adaptacija Stanova</h3>', '<h3 data-i18n="p:portfolio.adapt_title">Adaptacija Stanova</h3>', 1),
        (
            '<p>Beograd — prezentacija adaptacije i portfolija</p>',
            '<p data-i18n="p:portfolio.adapt_sub">Beograd — prezentacija adaptacije i portfolija</p>',
            1,
        ),
        (
            '<iframe src="https://vodoinstalater.store/" title="Pregled sajta Majstor"',
            '<iframe src="https://vodoinstalater.store/" data-i18n-iframetitle="p:portfolio.majstor_iframe" title="Pregled sajta Majstor"',
            1,
        ),
        ('<h3>Majstor Pro</h3>', '<h3 data-i18n="p:portfolio.majstor_title">Majstor Pro</h3>', 1),
        (
            '<p>Beograd — majstor, vodoinstalater, brzi kontakt</p>',
            '<p data-i18n="p:portfolio.majstor_sub">Beograd — majstor, vodoinstalater, brzi kontakt</p>',
            1,
        ),
        (
            '<span class="subtitle">Poverenje</span>',
            '<span class="subtitle" data-i18n="p:testimonials.subtitle">Poverenje</span>',
            1,
        ),
        ('<h2>Šta klijenti kažu</h2>', '<h2 data-i18n="p:testimonials.h2">Šta klijenti kažu</h2>', 1),
        (
            '<span class="g-name">Marko Jovanović</span>',
            '<span class="g-name" data-i18n="p:testimonials.mj_name">Marko Jovanović</span>',
            1,
        ),
        (
            '<span class="g-badge">2 recenzije</span>',
            '<span class="g-badge" data-i18n="p:testimonials.mj_badge">2 recenzije</span>',
            1,
        ),
        (
            '<span class="g-name">Ana Stefanović</span>',
            '<span class="g-name" data-i18n="p:testimonials.as_name">Ana Stefanović</span>',
            1,
        ),
        (
            '<span class="g-badge">Prva recenzija</span>',
            '<span class="g-badge" data-i18n="p:testimonials.as_badge">Prva recenzija</span>',
            1,
        ),
        (
            '<span class="g-name">Filip Nikolić</span>',
            '<span class="g-name" data-i18n="p:testimonials.fn_name">Filip Nikolić</span>',
            1,
        ),
        (
            '<span class="g-badge">5 recenzija</span>',
            '<span class="g-badge" data-i18n="p:testimonials.fn_badge">5 recenzija</span>',
            1,
        ),
        (
            '<p class="g-text">CreateWebPlace nivo profesionalizma je na nivou koji retko srećemo. Sajt se učitava ispod 1s, a konverzije su vidljivo bolje. Preporučujem.</p>',
            '<p class="g-text" data-i18n="p:testimonials.mj_quote">CreateWebPlace nivo profesionalizma je na nivou koji retko srećemo. Sajt se učitava ispod 1s, a konverzije su vidljivo bolje. Preporučujem.</p>',
            1,
        ),
        (
            '<p class="g-text">Jasna komunikacija, rokovi ispoštovani, dizajn tačno onakav kako smo zamislili. Tim zna šta radi.</p>',
            '<p class="g-text" data-i18n="p:testimonials.as_quote">Jasna komunikacija, rokovi ispoštovani, dizajn tačno onakav kako smo zamislili. Tim zna šta radi.</p>',
            1,
        ),
        (
            '<p class="g-text">Dugo tražili pouzdanog partnera za web i SEO. Sada imamo merni setup i jasan rast. Vredi svake investicije.</p>',
            '<p class="g-text" data-i18n="p:testimonials.fn_quote">Dugo tražili pouzdanog partnera za web i SEO. Sada imamo merni setup i jasan rast. Vredi svake investicije.</p>',
            1,
        ),
        ('<span class="subtitle">O Nama</span>', '<span class="subtitle" data-i18n="p:about.subtitle">O Nama</span>', 1),
        (
            '<h2>Vizija Digitalne Izvrsnosti</h2>',
            '<h2 data-i18n="p:about.h2">Vizija Digitalne Izvrsnosti</h2>',
            1,
        ),
        (
            '<p>Mi nismo samo agencija, mi smo tvoj tehnološki partner. Verujemo u minimalistički pristup gde svaki element ima svoju svrhu, a tehnologija služi biznisu, a ne obrnuto.</p>',
            '<p data-i18n="p:about.p">Mi nismo samo agencija, mi smo tvoj tehnološki partner. Verujemo u minimalistički pristup gde svaki element ima svoju svrhu, a tehnologija služi biznisu, a ne obrnuto.</p>',
            1,
        ),
        ('<p>Projekata</p>', '<p data-i18n="p:about.projects">Projekata</p>', 1),
        ('<p>Uptime</p>', '<p data-i18n="p:about.uptime">Uptime</p>', 1),
    ]
    html = rchain(html, tail_specs)
    html = re.sub(
        r'<iframe(?![^>]*data-i18n-iframetitle)(\s[^>]*src="https://tally\.so/embed)',
        r'<iframe data-i18n-iframetitle="p:iframe_contact"\1',
        html,
    )
    html = html.replace(
        'aria-label="ocena, 5 od 5 zvezdica"',
        'aria-label="" data-i18n-aria="c:reviews.stars_5"',
    )
    html = html.replace(
        'aria-label="ocena, 4 od 5 zvezdica"',
        'aria-label="" data-i18n-aria="c:reviews.stars_4"',
    )
    return html


def process_file(path: pathlib.Path) -> None:
    name = path.name
    html = path.read_text(encoding="utf-8")
    slug = page_slug(name)
    html = add_body_data_page(html, slug)

    if name == "404.html":
        html = insert_lang_404(html)
    else:
        html = insert_lang_switch(html)

    html = insert_i18n_script(html)
    html = chrome(html)

    if name == "hosting.html":
        html = mark_hosting(html)
    elif name in SERVICE_STD:
        html = mark_service_standard(html)
    elif name == "usluge.html":
        html = mark_usluge(html)
    elif name == "index.html":
        html = mark_index(html)
    elif name == "projekti.html":
        html = mark_projekti(html)
    elif name == "o-nama.html":
        html = mark_o_nama(html)
    elif name == "kontakt.html":
        html = mark_kontakt(html)
    elif name == "404.html":
        html = mark_404_main(html)

    path.write_text(html, encoding="utf-8")


def main() -> None:
    for path in sorted(ROOT.glob("*.html")):
        process_file(path)


if __name__ == "__main__":
    main()
