#!/usr/bin/env node
/**
 * Vocab Intro Slideshow Injector
 * Adds dedicated vocabulary intro slides before existing vocab activities
 * in Neft Teacher lesson HTML files.
 */

const fs = require("fs");
const path = require("path");

// SVG illustrations for math concepts
const SVG_LIBRARY = {
  // Numbers & Operations
  integer: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><line x1="30" y1="150" x2="270" y2="150" stroke="#1a6fb5" stroke-width="3"/><circle cx="150" cy="150" r="8" fill="#1a6fb5"/><text x="150" y="175" text-anchor="middle" font-size="16" fill="#1a6fb5" font-weight="700">0</text><circle cx="70" cy="150" r="6" fill="#c45a3c"/><text x="70" y="175" text-anchor="middle" font-size="16" fill="#c45a3c" font-weight="700">-2</text><circle cx="110" cy="150" r="6" fill="#c45a3c"/><text x="110" y="175" text-anchor="middle" font-size="16" fill="#c45a3c" font-weight="700">-1</text><circle cx="190" cy="150" r="6" fill="#2d874b"/><text x="190" y="175" text-anchor="middle" font-size="16" fill="#2d874b" font-weight="700">1</text><circle cx="230" cy="150" r="6" fill="#2d874b"/><text x="230" y="175" text-anchor="middle" font-size="16" fill="#2d874b" font-weight="700">2</text><text x="150" y="80" text-anchor="middle" font-size="20" fill="#0f2b3c" font-weight="700">...  -2  -1  0  1  2  ...</text><text x="80" y="110" text-anchor="middle" font-size="14" fill="#c45a3c">negative</text><text x="220" y="110" text-anchor="middle" font-size="14" fill="#2d874b">positive</text></svg>`,
  "negative integer": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdeee9"/><line x1="30" y1="180" x2="270" y2="180" stroke="#333" stroke-width="2"/><circle cx="210" cy="180" r="6" fill="#1a6fb5"/><text x="210" y="200" text-anchor="middle" font-size="14" fill="#333">0</text><circle cx="90" cy="180" r="10" fill="#c45a3c" stroke="#fff" stroke-width="2"/><text x="90" y="200" text-anchor="middle" font-size="14" fill="#c45a3c" font-weight="700">-3</text><circle cx="130" cy="180" r="10" fill="#c45a3c" stroke="#fff" stroke-width="2"/><text x="130" y="200" text-anchor="middle" font-size="14" fill="#c45a3c" font-weight="700">-2</text><circle cx="170" cy="180" r="10" fill="#c45a3c" stroke="#fff" stroke-width="2"/><text x="170" y="200" text-anchor="middle" font-size="14" fill="#c45a3c" font-weight="700">-1</text><text x="150" y="80" text-anchor="middle" font-size="22" fill="#c45a3c" font-weight="700">-3, -10, -100</text><text x="150" y="110" text-anchor="middle" font-size="15" fill="#333">Less than zero</text><path d="M210 165 L90 165" stroke="#c45a3c" stroke-width="2" fill="none" marker-end="url(#arrowR)"/><defs><marker id="arrowR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#c45a3c"/></marker></defs></svg>`,
  "absolute value": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><line x1="30" y1="190" x2="270" y2="190" stroke="#333" stroke-width="2"/><circle cx="150" cy="190" r="6" fill="#0e8a7d"/><text x="150" y="215" text-anchor="middle" font-size="14" fill="#333" font-weight="700">0</text><circle cx="90" cy="190" r="8" fill="#c45a3c"/><text x="90" y="215" text-anchor="middle" font-size="14" fill="#c45a3c" font-weight="700">-6</text><circle cx="210" cy="190" r="8" fill="#2d874b"/><text x="210" y="215" text-anchor="middle" font-size="14" fill="#2d874b" font-weight="700">6</text><path d="M92 175 L148 175" stroke="#d4952a" stroke-width="3" stroke-dasharray="5,3"/><path d="M152 175 L208 175" stroke="#d4952a" stroke-width="3" stroke-dasharray="5,3"/><text x="120" y="168" text-anchor="middle" font-size="13" fill="#d4952a" font-weight="700">6 units</text><text x="180" y="168" text-anchor="middle" font-size="13" fill="#d4952a" font-weight="700">6 units</text><text x="150" y="70" text-anchor="middle" font-size="24" fill="#0e8a7d" font-weight="700">|-6| = 6</text><text x="150" y="100" text-anchor="middle" font-size="15" fill="#333">Distance from zero</text><text x="150" y="125" text-anchor="middle" font-size="14" fill="#666">Always positive or zero</text></svg>`,
  opposite: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><line x1="30" y1="180" x2="270" y2="180" stroke="#333" stroke-width="2"/><circle cx="150" cy="180" r="6" fill="#333"/><text x="150" y="205" text-anchor="middle" font-size="14" fill="#333" font-weight="700">0</text><circle cx="80" cy="180" r="12" fill="#c45a3c" stroke="#fff" stroke-width="2"/><text x="80" y="185" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">-4</text><circle cx="220" cy="180" r="12" fill="#2d874b" stroke="#fff" stroke-width="2"/><text x="220" y="185" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">4</text><path d="M80 155 C80 110 220 110 220 155" stroke="#d4952a" stroke-width="2" fill="none" stroke-dasharray="6,3"/><text x="150" y="115" text-anchor="middle" font-size="14" fill="#d4952a" font-weight="700">same distance</text><text x="150" y="70" text-anchor="middle" font-size="20" fill="#0f2b3c" font-weight="700">4 and -4</text><text x="150" y="250" text-anchor="middle" font-size="14" fill="#666">Same distance, opposite sides</text></svg>`,
  "additive inverse": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><rect x="60" y="80" width="80" height="60" rx="10" fill="#c45a3c"/><text x="100" y="118" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">-5</text><rect x="160" y="80" width="80" height="60" rx="10" fill="#2d874b"/><text x="200" y="118" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">+5</text><text x="145" y="118" text-anchor="middle" font-size="24" fill="#333" font-weight="700">+</text><text x="150" y="180" text-anchor="middle" font-size="28" fill="#0e8a7d" font-weight="700">= 0</text><text x="150" y="230" text-anchor="middle" font-size="15" fill="#666">They cancel each other out!</text></svg>`,
  "number line": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><line x1="20" y1="150" x2="280" y2="150" stroke="#0e8a7d" stroke-width="3"/><polygon points="275,145 285,150 275,155" fill="#0e8a7d"/><polygon points="25,145 15,150 25,155" fill="#0e8a7d"/><g font-size="14" fill="#333" text-anchor="middle" font-weight="700"><line x1="50" y1="145" x2="50" y2="155" stroke="#333" stroke-width="2"/><text x="50" y="175">-3</text><line x1="90" y1="145" x2="90" y2="155" stroke="#333" stroke-width="2"/><text x="90" y="175">-2</text><line x1="130" y1="145" x2="130" y2="155" stroke="#333" stroke-width="2"/><text x="130" y="175">-1</text><line x1="170" y1="145" x2="170" y2="155" stroke="#333" stroke-width="2"/><text x="170" y="175">0</text><line x1="210" y1="145" x2="210" y2="155" stroke="#333" stroke-width="2"/><text x="210" y="175">1</text><line x1="250" y1="145" x2="250" y2="155" stroke="#333" stroke-width="2"/><text x="250" y="175">2</text></g><circle cx="90" cy="150" r="8" fill="#1a6fb5"/><text x="150" y="80" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">Every point is a number</text></svg>`,
  "zero pair": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><circle cx="100" cy="130" r="40" fill="#c45a3c" opacity="0.9"/><text x="100" y="138" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">+3</text><circle cx="200" cy="130" r="40" fill="#1a6fb5" opacity="0.9"/><text x="200" y="138" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">-3</text><text x="150" y="210" text-anchor="middle" font-size="22" fill="#333" font-weight="700">+3 + (-3) = 0</text><text x="150" y="250" text-anchor="middle" font-size="14" fill="#666">They cancel out to zero!</text></svg>`,
  product: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><rect x="30" y="80" width="100" height="50" rx="8" fill="#1a6fb5"/><text x="80" y="112" text-anchor="middle" font-size="20" fill="#fff" font-weight="700">(-4)</text><text x="145" y="112" text-anchor="middle" font-size="24" fill="#333" font-weight="700">x</text><rect x="170" y="80" width="100" height="50" rx="8" fill="#1a6fb5"/><text x="220" y="112" text-anchor="middle" font-size="20" fill="#fff" font-weight="700">(-2)</text><text x="150" y="180" text-anchor="middle" font-size="16" fill="#666">=</text><rect x="90" y="195" width="120" height="50" rx="8" fill="#2d874b"/><text x="150" y="228" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">8</text><text x="150" y="280" text-anchor="middle" font-size="13" fill="#666">negative x negative = positive</text></svg>`,
  // Ratios & Proportions
  ratio: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><circle cx="70" cy="120" r="22" fill="#c45a3c"/><circle cx="120" cy="120" r="22" fill="#c45a3c"/><circle cx="95" cy="165" r="22" fill="#c45a3c"/><circle cx="210" cy="120" r="22" fill="#1a6fb5"/><circle cx="210" cy="170" r="22" fill="#1a6fb5"/><text x="150" y="60" text-anchor="middle" font-size="20" fill="#0f2b3c" font-weight="700">3 : 2</text><text x="95" y="220" text-anchor="middle" font-size="16" fill="#c45a3c" font-weight="700">3 red</text><text x="210" y="220" text-anchor="middle" font-size="16" fill="#1a6fb5" font-weight="700">2 blue</text><text x="150" y="270" text-anchor="middle" font-size="14" fill="#666">Comparing two groups</text></svg>`,
  rate: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="60" text-anchor="middle" font-size="18" fill="#0f2b3c" font-weight="700">Different Units</text><rect x="40" y="80" width="100" height="70" rx="10" fill="#d4952a"/><text x="90" y="110" text-anchor="middle" font-size="18" fill="#fff" font-weight="700">$30</text><text x="90" y="135" text-anchor="middle" font-size="12" fill="#fff">dollars</text><rect x="160" y="80" width="100" height="70" rx="10" fill="#0e8a7d"/><text x="210" y="110" text-anchor="middle" font-size="18" fill="#fff" font-weight="700">6 hrs</text><text x="210" y="135" text-anchor="middle" font-size="12" fill="#fff">hours</text><text x="150" y="190" text-anchor="middle" font-size="20" fill="#333" font-weight="700">$30 / 6 hours</text><text x="150" y="230" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">= $5 per hour</text></svg>`,
  "unit rate": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><rect x="60" y="70" width="180" height="80" rx="12" fill="#1a6fb5"/><text x="150" y="105" text-anchor="middle" font-size="20" fill="#fff" font-weight="700">60 miles</text><text x="150" y="135" text-anchor="middle" font-size="14" fill="#dbeafe">per 1 hour</text><line x1="60" y1="190" x2="240" y2="190" stroke="#333" stroke-width="2"/><text x="80" y="220" text-anchor="middle" font-size="14" fill="#333" font-weight="700">0 mi</text><text x="150" y="220" text-anchor="middle" font-size="14" fill="#333" font-weight="700">30 mi</text><text x="220" y="220" text-anchor="middle" font-size="14" fill="#333" font-weight="700">60 mi</text><text x="150" y="270" text-anchor="middle" font-size="14" fill="#666">Amount per ONE unit</text></svg>`,
  "unit price": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><rect x="80" y="60" width="140" height="100" rx="12" fill="#d4952a"/><text x="150" y="100" text-anchor="middle" font-size="18" fill="#fff" font-weight="700">$2.50</text><text x="150" y="130" text-anchor="middle" font-size="14" fill="#fff">per 1 can</text><ellipse cx="100" cy="210" rx="30" ry="40" fill="#c45a3c" opacity="0.8"/><text x="100" y="215" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">CAN</text><ellipse cx="150" cy="210" rx="30" ry="40" fill="#c45a3c" opacity="0.8"/><text x="150" y="215" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">CAN</text><ellipse cx="200" cy="210" rx="30" ry="40" fill="#c45a3c" opacity="0.8"/><text x="200" y="215" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">CAN</text><text x="150" y="280" text-anchor="middle" font-size="14" fill="#666">Cost per 1 item</text></svg>`,
  "equivalent ratio": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><rect x="30" y="80" width="110" height="50" rx="8" fill="#0e8a7d"/><text x="85" y="112" text-anchor="middle" font-size="22" fill="#fff" font-weight="700">2 : 3</text><rect x="160" y="80" width="110" height="50" rx="8" fill="#0e8a7d"/><text x="215" y="112" text-anchor="middle" font-size="22" fill="#fff" font-weight="700">4 : 6</text><text x="150" y="112" text-anchor="middle" font-size="18" fill="#333" font-weight="700">=</text><text x="85" y="165" text-anchor="middle" font-size="14" fill="#333">x2</text><path d="M85 145 L215 145" stroke="#d4952a" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#eq1)"/><defs><marker id="eq1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#d4952a"/></marker></defs><text x="150" y="230" text-anchor="middle" font-size="15" fill="#666">Same relationship, different numbers</text></svg>`,
  proportion: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="80" y="120" text-anchor="middle" font-size="28" fill="#1a6fb5" font-weight="700">2/3</text><text x="150" y="120" text-anchor="middle" font-size="28" fill="#333" font-weight="700">=</text><text x="220" y="120" text-anchor="middle" font-size="28" fill="#1a6fb5" font-weight="700">4/6</text><rect x="50" y="160" width="200" height="3" rx="1" fill="#ddd"/><text x="150" y="200" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">Two equal ratios</text><text x="150" y="240" text-anchor="middle" font-size="14" fill="#666">An equation that says</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">two ratios are the same</text></svg>`,
  percent: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><rect x="50" y="70" width="200" height="30" rx="6" fill="#eee" stroke="#ccc" stroke-width="1"/><rect x="50" y="70" width="150" height="30" rx="6" fill="#d4952a"/><text x="125" y="92" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">75%</text><text x="150" y="140" text-anchor="middle" font-size="24" fill="#333" font-weight="700">75 out of 100</text><text x="150" y="175" text-anchor="middle" font-size="16" fill="#d4952a" font-weight="700">75/100 = 75%</text><text x="150" y="230" text-anchor="middle" font-size="14" fill="#666">"Per hundred"</text></svg>`,
  "conversion factor": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><rect x="40" y="80" width="100" height="60" rx="10" fill="#0e8a7d"/><text x="90" y="115" text-anchor="middle" font-size="16" fill="#fff" font-weight="700">12 in</text><text x="150" y="115" text-anchor="middle" font-size="20" fill="#333" font-weight="700">=</text><rect x="160" y="80" width="100" height="60" rx="10" fill="#1a6fb5"/><text x="210" y="115" text-anchor="middle" font-size="16" fill="#fff" font-weight="700">1 ft</text><path d="M90 160 C90 200 210 200 210 160" stroke="#d4952a" stroke-width="3" fill="none" marker-end="url(#cf1)"/><defs><marker id="cf1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#d4952a"/></marker></defs><text x="150" y="220" text-anchor="middle" font-size="15" fill="#d4952a" font-weight="700">12 in / 1 ft</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">A ratio equal to 1</text></svg>`,
  "constant of proportionality": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="150" y="80" text-anchor="middle" font-size="26" fill="#1a6fb5" font-weight="700">y = kx</text><text x="150" y="120" text-anchor="middle" font-size="16" fill="#333">where k = unit rate</text><line x1="60" y1="260" x2="260" y2="260" stroke="#333" stroke-width="2"/><line x1="60" y1="140" x2="60" y2="260" stroke="#333" stroke-width="2"/><line x1="60" y1="260" x2="240" y2="140" stroke="#0e8a7d" stroke-width="3"/><circle cx="100" cy="248" r="5" fill="#d4952a"/><circle cx="140" cy="236" r="5" fill="#d4952a"/><circle cx="180" cy="224" r="5" fill="#d4952a"/><text x="250" y="145" font-size="14" fill="#0e8a7d" font-weight="700">k</text></svg>`,
  "double number line": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><text x="150" y="50" text-anchor="middle" font-size="14" fill="#333" font-weight="700">Two aligned number lines</text><line x1="40" y1="120" x2="260" y2="120" stroke="#d4952a" stroke-width="3"/><text x="20" y="100" font-size="11" fill="#d4952a" font-weight="700">$</text><text x="60" y="110" text-anchor="middle" font-size="12" fill="#d4952a">$0</text><text x="120" y="110" text-anchor="middle" font-size="12" fill="#d4952a">$5</text><text x="180" y="110" text-anchor="middle" font-size="12" fill="#d4952a">$10</text><text x="240" y="110" text-anchor="middle" font-size="12" fill="#d4952a">$15</text><line x1="40" y1="180" x2="260" y2="180" stroke="#0e8a7d" stroke-width="3"/><text x="16" y="200" font-size="11" fill="#0e8a7d" font-weight="700">lb</text><text x="60" y="200" text-anchor="middle" font-size="12" fill="#0e8a7d">0</text><text x="120" y="200" text-anchor="middle" font-size="12" fill="#0e8a7d">1</text><text x="180" y="200" text-anchor="middle" font-size="12" fill="#0e8a7d">2</text><text x="240" y="200" text-anchor="middle" font-size="12" fill="#0e8a7d">3</text><line x1="60" y1="125" x2="60" y2="175" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/><line x1="120" y1="125" x2="120" y2="175" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/><line x1="180" y1="125" x2="180" y2="175" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/><line x1="240" y1="125" x2="240" y2="175" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/><text x="150" y="250" text-anchor="middle" font-size="14" fill="#666">Equivalent ratios lined up</text></svg>`,
  "tape diagram": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="150" y="50" text-anchor="middle" font-size="14" fill="#333" font-weight="700">Visual ratio bars</text><rect x="40" y="80" width="60" height="40" rx="4" fill="#c45a3c" stroke="#fff" stroke-width="2"/><rect x="100" y="80" width="60" height="40" rx="4" fill="#c45a3c" stroke="#fff" stroke-width="2"/><rect x="160" y="80" width="60" height="40" rx="4" fill="#c45a3c" stroke="#fff" stroke-width="2"/><text x="130" y="106" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">3 parts</text><rect x="40" y="150" width="60" height="40" rx="4" fill="#1a6fb5" stroke="#fff" stroke-width="2"/><rect x="100" y="150" width="60" height="40" rx="4" fill="#1a6fb5" stroke="#fff" stroke-width="2"/><text x="100" y="176" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">2 parts</text><text x="150" y="240" text-anchor="middle" font-size="16" fill="#333" font-weight="700">Ratio 3 : 2</text></svg>`,
  denominator: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="100" text-anchor="middle" font-size="40" fill="#333" font-weight="700">3</text><line x1="110" y1="115" x2="190" y2="115" stroke="#333" stroke-width="4"/><text x="150" y="165" text-anchor="middle" font-size="40" fill="#0e8a7d" font-weight="700">4</text><path d="M200 155 L250 155" stroke="#0e8a7d" stroke-width="2"/><text x="265" y="160" font-size="14" fill="#0e8a7d" font-weight="700">bottom</text><text x="150" y="230" text-anchor="middle" font-size="16" fill="#333">The number you divide by</text></svg>`,
  per: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><text x="150" y="80" text-anchor="middle" font-size="22" fill="#d4952a" font-weight="700">"per" = for each one</text><rect x="80" y="110" width="140" height="70" rx="10" fill="#d4952a"/><text x="150" y="145" text-anchor="middle" font-size="20" fill="#fff" font-weight="700">$5</text><text x="150" y="170" text-anchor="middle" font-size="14" fill="#fff">per burger</text><text x="150" y="230" text-anchor="middle" font-size="16" fill="#333" font-weight="700">$5 per 1 burger</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">The key word for unit rates</text></svg>`,
  // Statistics & Data
  mean: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="150" y="50" text-anchor="middle" font-size="16" fill="#1a6fb5" font-weight="700">Mean (Average)</text><rect x="40" y="80" width="40" height="30" rx="4" fill="#1a6fb5"/><text x="60" y="100" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">2</text><rect x="90" y="80" width="40" height="30" rx="4" fill="#1a6fb5"/><text x="110" y="100" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">4</text><rect x="140" y="80" width="40" height="30" rx="4" fill="#1a6fb5"/><text x="160" y="100" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">4</text><rect x="190" y="80" width="40" height="30" rx="4" fill="#1a6fb5"/><text x="210" y="100" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">5</text><rect x="240" y="80" width="40" height="30" rx="4" fill="#1a6fb5"/><text x="260" y="100" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">10</text><text x="150" y="150" text-anchor="middle" font-size="16" fill="#333">(2+4+4+5+10) / 5</text><text x="150" y="185" text-anchor="middle" font-size="28" fill="#0e8a7d" font-weight="700">= 5</text><text x="150" y="240" text-anchor="middle" font-size="14" fill="#666">Add all values, divide by count</text></svg>`,
  median: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="50" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">Median (Middle Value)</text><rect x="30" y="100" width="44" height="35" rx="4" fill="#ccc"/><text x="52" y="123" text-anchor="middle" font-size="16" fill="#666" font-weight="700">2</text><rect x="80" y="100" width="44" height="35" rx="4" fill="#ccc"/><text x="102" y="123" text-anchor="middle" font-size="16" fill="#666" font-weight="700">4</text><rect x="130" y="90" width="44" height="45" rx="4" fill="#0e8a7d" stroke="#d4952a" stroke-width="3"/><text x="152" y="120" text-anchor="middle" font-size="20" fill="#fff" font-weight="700">4</text><rect x="180" y="100" width="44" height="35" rx="4" fill="#ccc"/><text x="202" y="123" text-anchor="middle" font-size="16" fill="#666" font-weight="700">5</text><rect x="230" y="100" width="44" height="35" rx="4" fill="#ccc"/><text x="252" y="123" text-anchor="middle" font-size="16" fill="#666" font-weight="700">10</text><path d="M152 145 L152 185" stroke="#d4952a" stroke-width="3"/><text x="152" y="210" text-anchor="middle" font-size="18" fill="#d4952a" font-weight="700">Middle!</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">Put in order, find the middle</text></svg>`,
  range: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdeee9"/><text x="150" y="50" text-anchor="middle" font-size="16" fill="#c45a3c" font-weight="700">Range (Spread)</text><line x1="40" y1="150" x2="260" y2="150" stroke="#333" stroke-width="2"/><circle cx="60" cy="150" r="10" fill="#c45a3c"/><text x="60" y="180" text-anchor="middle" font-size="16" fill="#c45a3c" font-weight="700">2</text><circle cx="240" cy="150" r="10" fill="#1a6fb5"/><text x="240" y="180" text-anchor="middle" font-size="16" fill="#1a6fb5" font-weight="700">10</text><path d="M65 130 L235 130" stroke="#d4952a" stroke-width="3" marker-start="url(#rs)" marker-end="url(#re)"/><defs><marker id="rs" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="#d4952a"/></marker><marker id="re" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#d4952a"/></marker></defs><text x="150" y="125" text-anchor="middle" font-size="18" fill="#d4952a" font-weight="700">10 - 2 = 8</text><text x="150" y="240" text-anchor="middle" font-size="14" fill="#666">Greatest minus least</text></svg>`,
  outlier: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><text x="150" y="50" text-anchor="middle" font-size="16" fill="#d4952a" font-weight="700">Outlier</text><circle cx="60" cy="180" r="8" fill="#1a6fb5"/><circle cx="85" cy="180" r="8" fill="#1a6fb5"/><circle cx="105" cy="180" r="8" fill="#1a6fb5"/><circle cx="130" cy="180" r="8" fill="#1a6fb5"/><circle cx="150" cy="180" r="8" fill="#1a6fb5"/><circle cx="250" cy="180" r="12" fill="#c45a3c" stroke="#d4952a" stroke-width="3"/><text x="250" y="185" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">!</text><line x1="40" y1="200" x2="270" y2="200" stroke="#333" stroke-width="1"/><text x="100" y="220" text-anchor="middle" font-size="12" fill="#1a6fb5">cluster</text><text x="250" y="220" text-anchor="middle" font-size="12" fill="#c45a3c" font-weight="700">far away!</text><text x="150" y="270" text-anchor="middle" font-size="14" fill="#666">A value far from the rest</text></svg>`,
  cluster: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="150" y="50" text-anchor="middle" font-size="16" fill="#1a6fb5" font-weight="700">Cluster</text><circle cx="120" cy="150" r="10" fill="#0e8a7d" opacity="0.8"/><circle cx="140" cy="140" r="10" fill="#0e8a7d" opacity="0.8"/><circle cx="135" cy="165" r="10" fill="#0e8a7d" opacity="0.8"/><circle cx="155" cy="155" r="10" fill="#0e8a7d" opacity="0.8"/><circle cx="165" cy="140" r="10" fill="#0e8a7d" opacity="0.8"/><circle cx="150" cy="175" r="10" fill="#0e8a7d" opacity="0.8"/><ellipse cx="145" cy="155" rx="45" ry="35" fill="none" stroke="#d4952a" stroke-width="2" stroke-dasharray="5,3"/><text x="145" y="215" text-anchor="middle" font-size="16" fill="#d4952a" font-weight="700">grouped together</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">Values close to each other</text></svg>`,
  data: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="50" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">Data</text><rect x="60" y="80" width="180" height="30" rx="6" fill="#0e8a7d"/><text x="150" y="100" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">3  5  7  2  9  4  6</text><rect x="60" y="125" width="40" height="70" rx="4" fill="#1a6fb5"/><rect x="110" y="105" width="40" height="90" rx="4" fill="#1a6fb5"/><rect x="160" y="135" width="40" height="60" rx="4" fill="#1a6fb5"/><rect x="210" y="85" width="40" height="110" rx="4" fill="#1a6fb5"/><text x="150" y="240" text-anchor="middle" font-size="15" fill="#333" font-weight="700">Collected information</text><text x="150" y="270" text-anchor="middle" font-size="14" fill="#666">Numbers, facts, or values</text></svg>`,
  interval: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><text x="150" y="50" text-anchor="middle" font-size="16" fill="#d4952a" font-weight="700">Interval</text><line x1="30" y1="150" x2="270" y2="150" stroke="#333" stroke-width="2"/><rect x="50" y="135" width="60" height="30" rx="4" fill="#d4952a" opacity="0.3" stroke="#d4952a" stroke-width="2"/><text x="80" y="155" text-anchor="middle" font-size="12" fill="#333" font-weight="700">0-10</text><rect x="120" y="135" width="60" height="30" rx="4" fill="#0e8a7d" opacity="0.3" stroke="#0e8a7d" stroke-width="2"/><text x="150" y="155" text-anchor="middle" font-size="12" fill="#333" font-weight="700">10-20</text><rect x="190" y="135" width="60" height="30" rx="4" fill="#1a6fb5" opacity="0.3" stroke="#1a6fb5" stroke-width="2"/><text x="220" y="155" text-anchor="middle" font-size="12" fill="#333" font-weight="700">20-30</text><text x="150" y="220" text-anchor="middle" font-size="15" fill="#333" font-weight="700">A range between two values</text><text x="150" y="250" text-anchor="middle" font-size="14" fill="#666">Same size, no overlap</text></svg>`,
  frequency: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="150" y="40" text-anchor="middle" font-size="16" fill="#1a6fb5" font-weight="700">Frequency</text><rect x="60" y="180" width="50" height="40" rx="4" fill="#1a6fb5"/><text x="85" y="205" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">3</text><rect x="120" y="120" width="50" height="100" rx="4" fill="#1a6fb5"/><text x="145" y="175" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">8</text><rect x="180" y="140" width="50" height="80" rx="4" fill="#1a6fb5"/><text x="205" y="185" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">5</text><line x1="50" y1="220" x2="240" y2="220" stroke="#333" stroke-width="2"/><text x="150" y="260" text-anchor="middle" font-size="15" fill="#333" font-weight="700">How many times it happens</text></svg>`,
  histogram: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="40" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">Histogram</text><line x1="50" y1="220" x2="260" y2="220" stroke="#333" stroke-width="2"/><line x1="50" y1="80" x2="50" y2="220" stroke="#333" stroke-width="2"/><rect x="55" y="160" width="45" height="60" fill="#0e8a7d" stroke="#fff" stroke-width="1"/><rect x="100" y="100" width="45" height="120" fill="#0e8a7d" stroke="#fff" stroke-width="1"/><rect x="145" y="130" width="45" height="90" fill="#0e8a7d" stroke="#fff" stroke-width="1"/><rect x="190" y="180" width="45" height="40" fill="#0e8a7d" stroke="#fff" stroke-width="1"/><text x="77" y="240" text-anchor="middle" font-size="10" fill="#333">5-10</text><text x="122" y="240" text-anchor="middle" font-size="10" fill="#333">10-15</text><text x="167" y="240" text-anchor="middle" font-size="10" fill="#333">15-20</text><text x="212" y="240" text-anchor="middle" font-size="10" fill="#333">20-25</text><text x="150" y="275" text-anchor="middle" font-size="13" fill="#666">Bars touch! Shows intervals + frequency</text></svg>`,
  pace: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="150" y="50" text-anchor="middle" font-size="16" fill="#1a6fb5" font-weight="700">Pace</text><circle cx="80" cy="130" r="30" fill="#1a6fb5" opacity="0.2"/><text x="80" y="135" text-anchor="middle" font-size="11" fill="#1a6fb5" font-weight="700">FAST</text><text x="80" y="175" text-anchor="middle" font-size="14" fill="#1a6fb5">5 min/km</text><circle cx="220" cy="130" r="30" fill="#c45a3c" opacity="0.2"/><text x="220" y="135" text-anchor="middle" font-size="11" fill="#c45a3c" font-weight="700">SLOW</text><text x="220" y="175" text-anchor="middle" font-size="14" fill="#c45a3c">8 min/km</text><text x="150" y="230" text-anchor="middle" font-size="15" fill="#333" font-weight="700">Time per 1 unit of distance</text><text x="150" y="260" text-anchor="middle" font-size="13" fill="#666">Smaller pace = faster runner</text></svg>`,
  "mean absolute deviation": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdeee9"/><text x="150" y="45" text-anchor="middle" font-size="14" fill="#c45a3c" font-weight="700">Mean Absolute Deviation</text><line x1="40" y1="160" x2="260" y2="160" stroke="#333" stroke-width="2"/><circle cx="150" cy="160" r="6" fill="#0e8a7d"/><text x="150" y="185" text-anchor="middle" font-size="12" fill="#0e8a7d" font-weight="700">mean</text><circle cx="80" cy="160" r="6" fill="#1a6fb5"/><circle cx="120" cy="160" r="6" fill="#1a6fb5"/><circle cx="190" cy="160" r="6" fill="#1a6fb5"/><circle cx="230" cy="160" r="6" fill="#1a6fb5"/><path d="M80 145 L150 145" stroke="#d4952a" stroke-width="2" stroke-dasharray="4,2"/><path d="M150 145 L230 145" stroke="#d4952a" stroke-width="2" stroke-dasharray="4,2"/><text x="115" y="140" text-anchor="middle" font-size="11" fill="#d4952a">distance</text><text x="190" y="140" text-anchor="middle" font-size="11" fill="#d4952a">distance</text><text x="150" y="230" text-anchor="middle" font-size="13" fill="#333" font-weight="700">Average distance from the mean</text></svg>`,
  // Geometry & Area
  area: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><rect x="60" y="70" width="180" height="120" rx="4" fill="#0e8a7d" opacity="0.3" stroke="#0e8a7d" stroke-width="3"/><text x="150" y="140" text-anchor="middle" font-size="18" fill="#0e8a7d" font-weight="700">AREA</text><text x="150" y="165" text-anchor="middle" font-size="14" fill="#333">= l x w</text><text x="150" y="225" text-anchor="middle" font-size="15" fill="#333" font-weight="700">Space inside a shape</text><text x="150" y="255" text-anchor="middle" font-size="14" fill="#666">Measured in square units</text></svg>`,
  base: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><polygon points="60,200 240,200 180,80" fill="#d4952a" opacity="0.3" stroke="#d4952a" stroke-width="3"/><line x1="60" y1="200" x2="240" y2="200" stroke="#c45a3c" stroke-width="5"/><text x="150" y="225" text-anchor="middle" font-size="16" fill="#c45a3c" font-weight="700">base (b)</text><text x="150" y="265" text-anchor="middle" font-size="14" fill="#666">The bottom side of a shape</text></svg>`,
  height: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><polygon points="60,220 240,220 180,80" fill="#1a6fb5" opacity="0.2" stroke="#1a6fb5" stroke-width="2"/><line x1="180" y1="80" x2="180" y2="220" stroke="#c45a3c" stroke-width="3" stroke-dasharray="6,3"/><rect x="175" y="210" width="10" height="10" fill="none" stroke="#c45a3c" stroke-width="2"/><text x="200" y="155" font-size="16" fill="#c45a3c" font-weight="700">h</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">Straight distance between bases</text></svg>`,
  parallelogram: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><polygon points="80,200 220,200 260,100 120,100" fill="#0e8a7d" opacity="0.3" stroke="#0e8a7d" stroke-width="3"/><text x="170" y="160" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">A = b x h</text><line x1="80" y1="200" x2="220" y2="200" stroke="#c45a3c" stroke-width="3"/><text x="150" y="225" text-anchor="middle" font-size="13" fill="#c45a3c" font-weight="700">base</text><line x1="120" y1="100" x2="80" y2="200" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/></svg>`,
  trapezoid: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><polygon points="100,100 200,100 250,200 50,200" fill="#d4952a" opacity="0.3" stroke="#d4952a" stroke-width="3"/><line x1="100" y1="100" x2="200" y2="100" stroke="#1a6fb5" stroke-width="3"/><text x="150" y="92" text-anchor="middle" font-size="12" fill="#1a6fb5" font-weight="700">b1</text><line x1="50" y1="200" x2="250" y2="200" stroke="#c45a3c" stroke-width="3"/><text x="150" y="225" text-anchor="middle" font-size="12" fill="#c45a3c" font-weight="700">b2</text><line x1="150" y1="100" x2="150" y2="200" stroke="#0e8a7d" stroke-width="2" stroke-dasharray="5,3"/><text x="165" y="155" font-size="12" fill="#0e8a7d" font-weight="700">h</text><text x="150" y="265" text-anchor="middle" font-size="13" fill="#333" font-weight="700">A = 1/2(b1+b2) x h</text></svg>`,
  volume: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><path d="M80,180 L180,180 L220,120 L120,120 Z" fill="#1a6fb5" opacity="0.4" stroke="#1a6fb5" stroke-width="2"/><path d="M120,120 L220,120 L220,60 L120,60 Z" fill="#1a6fb5" opacity="0.25" stroke="#1a6fb5" stroke-width="2"/><path d="M80,180 L120,120 L120,60 L80,120 Z" fill="#1a6fb5" opacity="0.15" stroke="#1a6fb5" stroke-width="2"/><text x="155" y="155" text-anchor="middle" font-size="14" fill="#1a6fb5" font-weight="700">V = l x w x h</text><text x="150" y="230" text-anchor="middle" font-size="15" fill="#333" font-weight="700">Space inside a 3D shape</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">Measured in cubic units</text></svg>`,
  "rectangular prism": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><path d="M70,190 L190,190 L230,130 L110,130 Z" fill="#0e8a7d" opacity="0.4" stroke="#0e8a7d" stroke-width="2"/><path d="M110,130 L230,130 L230,60 L110,60 Z" fill="#0e8a7d" opacity="0.25" stroke="#0e8a7d" stroke-width="2"/><path d="M70,190 L110,130 L110,60 L70,120 Z" fill="#0e8a7d" opacity="0.15" stroke="#0e8a7d" stroke-width="2"/><text x="150" y="160" text-anchor="middle" font-size="12" fill="#0e8a7d" font-weight="700">V = l x w x h</text><text x="150" y="240" text-anchor="middle" font-size="14" fill="#666">A box shape with 6 faces</text></svg>`,
  "surface area": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdeee9"/><rect x="100" y="70" width="80" height="60" rx="4" fill="#c45a3c" opacity="0.5" stroke="#c45a3c" stroke-width="2"/><text x="140" y="105" text-anchor="middle" font-size="10" fill="#c45a3c" font-weight="700">top</text><rect x="20" y="140" width="80" height="60" rx="4" fill="#1a6fb5" opacity="0.5" stroke="#1a6fb5" stroke-width="2"/><text x="60" y="175" text-anchor="middle" font-size="10" fill="#1a6fb5" font-weight="700">side</text><rect x="100" y="140" width="80" height="60" rx="4" fill="#0e8a7d" opacity="0.5" stroke="#0e8a7d" stroke-width="2"/><text x="140" y="175" text-anchor="middle" font-size="10" fill="#0e8a7d" font-weight="700">front</text><rect x="180" y="140" width="80" height="60" rx="4" fill="#1a6fb5" opacity="0.5" stroke="#1a6fb5" stroke-width="2"/><text x="220" y="175" text-anchor="middle" font-size="10" fill="#1a6fb5" font-weight="700">side</text><rect x="100" y="210" width="80" height="60" rx="4" fill="#c45a3c" opacity="0.5" stroke="#c45a3c" stroke-width="2"/><text x="140" y="245" text-anchor="middle" font-size="10" fill="#c45a3c" font-weight="700">bottom</text><text x="150" y="290" text-anchor="middle" font-size="13" fill="#333" font-weight="700">Total area of all faces</text></svg>`,
  // Equations & Expressions
  variable: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><rect x="100" y="70" width="100" height="100" rx="12" fill="#d4952a" opacity="0.3" stroke="#d4952a" stroke-width="3"/><text x="150" y="135" text-anchor="middle" font-size="50" fill="#d4952a" font-weight="700">?</text><text x="150" y="210" text-anchor="middle" font-size="24" fill="#333" font-weight="700">x = ?</text><text x="150" y="250" text-anchor="middle" font-size="15" fill="#666">A letter for an unknown number</text></svg>`,
  equation: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><rect x="30" y="100" width="110" height="60" rx="10" fill="#1a6fb5"/><text x="85" y="138" text-anchor="middle" font-size="22" fill="#fff" font-weight="700">x + 3</text><text x="150" y="138" text-anchor="middle" font-size="28" fill="#333" font-weight="700">=</text><rect x="165" y="100" width="110" height="60" rx="10" fill="#0e8a7d"/><text x="220" y="138" text-anchor="middle" font-size="22" fill="#fff" font-weight="700">7</text><text x="150" y="210" text-anchor="middle" font-size="16" fill="#333" font-weight="700">Both sides are equal</text><text x="150" y="250" text-anchor="middle" font-size="14" fill="#666">Uses an = sign</text></svg>`,
  solution: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="80" text-anchor="middle" font-size="20" fill="#333">x + 3 = 7</text><text x="150" y="130" text-anchor="middle" font-size="20" fill="#0e8a7d" font-weight="700">x = 4</text><circle cx="150" cy="180" r="40" fill="#2d874b" opacity="0.2" stroke="#2d874b" stroke-width="3"/><text x="150" y="188" text-anchor="middle" font-size="28" fill="#2d874b" font-weight="700">4</text><text x="150" y="250" text-anchor="middle" font-size="15" fill="#333" font-weight="700">The value that makes it true</text></svg>`,
  "inverse operation": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><rect x="40" y="80" width="90" height="50" rx="8" fill="#1a6fb5"/><text x="85" y="112" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">+</text><path d="M140 105 L160 105" stroke="#d4952a" stroke-width="3" marker-end="url(#io1)"/><path d="M160 105 L140 105" stroke="#d4952a" stroke-width="3" marker-end="url(#io2)"/><defs><marker id="io1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#d4952a"/></marker><marker id="io2" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="#d4952a"/></marker></defs><rect x="170" y="80" width="90" height="50" rx="8" fill="#c45a3c"/><text x="215" y="112" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">-</text><rect x="40" y="170" width="90" height="50" rx="8" fill="#1a6fb5"/><text x="85" y="202" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">x</text><path d="M140 195 L160 195" stroke="#d4952a" stroke-width="3"/><rect x="170" y="170" width="90" height="50" rx="8" fill="#c45a3c"/><text x="215" y="202" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">/</text><text x="150" y="265" text-anchor="middle" font-size="15" fill="#333" font-weight="700">Opposite operations undo each other</text></svg>`,
  inequality: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="70" y="100" font-size="36" fill="#1a6fb5" font-weight="700">&gt;</text><text x="120" y="100" font-size="36" fill="#c45a3c" font-weight="700">&lt;</text><text x="180" y="100" font-size="28" fill="#0e8a7d" font-weight="700">&ge;</text><text x="230" y="100" font-size="28" fill="#d4952a" font-weight="700">&le;</text><line x1="40" y1="180" x2="260" y2="180" stroke="#333" stroke-width="2"/><circle cx="150" cy="180" r="8" fill="none" stroke="#1a6fb5" stroke-width="3"/><line x1="150" y1="180" x2="260" y2="180" stroke="#1a6fb5" stroke-width="4"/><text x="150" y="210" text-anchor="middle" font-size="14" fill="#1a6fb5" font-weight="700">x > 3</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">Compares with >, <, or =</text></svg>`,
  coefficient: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="110" y="140" font-size="60" fill="#c45a3c" font-weight="700">4</text><text x="170" y="140" font-size="60" fill="#0e8a7d" font-weight="700">x</text><path d="M110 155 L110 180" stroke="#c45a3c" stroke-width="2"/><text x="110" y="205" text-anchor="middle" font-size="16" fill="#c45a3c" font-weight="700">coefficient</text><path d="M170 155 L170 180" stroke="#0e8a7d" stroke-width="2"/><text x="170" y="205" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">variable</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">The number in front of a variable</text></svg>`,
  expression: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><rect x="50" y="80" width="200" height="70" rx="10" fill="#d4952a" opacity="0.2" stroke="#d4952a" stroke-width="3"/><text x="150" y="125" text-anchor="middle" font-size="28" fill="#d4952a" font-weight="700">3x + 5</text><text x="150" y="190" text-anchor="middle" font-size="16" fill="#333" font-weight="700">Numbers + variables + operations</text><text x="150" y="220" text-anchor="middle" font-size="18" fill="#c45a3c" font-weight="700">No = sign!</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">Not an equation (no equals)</text></svg>`,
  "open circle": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><line x1="40" y1="150" x2="260" y2="150" stroke="#333" stroke-width="2"/><circle cx="150" cy="150" r="12" fill="#fff" stroke="#1a6fb5" stroke-width="4"/><line x1="155" y1="150" x2="260" y2="150" stroke="#1a6fb5" stroke-width="5"/><text x="150" y="185" text-anchor="middle" font-size="16" fill="#333" font-weight="700">x > 3</text><text x="150" y="230" text-anchor="middle" font-size="15" fill="#1a6fb5" font-weight="700">NOT included</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">Used for > or <</text></svg>`,
  "closed circle": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><line x1="40" y1="150" x2="260" y2="150" stroke="#333" stroke-width="2"/><circle cx="150" cy="150" r="12" fill="#0e8a7d"/><line x1="155" y1="150" x2="260" y2="150" stroke="#0e8a7d" stroke-width="5"/><text x="150" y="185" text-anchor="middle" font-size="16" fill="#333" font-weight="700">x >= 3</text><text x="150" y="230" text-anchor="middle" font-size="15" fill="#0e8a7d" font-weight="700">IS included</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#666">Used for >= or <=</text></svg>`,
  // Division
  dividend: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="150" y="80" text-anchor="middle" font-size="16" fill="#333" font-weight="700">432 / 6 = 72</text><rect x="55" y="100" width="80" height="60" rx="10" fill="#1a6fb5"/><text x="95" y="140" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">432</text><text x="145" y="140" text-anchor="middle" font-size="24" fill="#333">/</text><rect x="155" y="100" width="60" height="60" rx="10" fill="#999"/><text x="185" y="140" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">6</text><path d="M95 170 L95 200" stroke="#1a6fb5" stroke-width="2"/><text x="95" y="225" text-anchor="middle" font-size="16" fill="#1a6fb5" font-weight="700">dividend</text><text x="150" y="270" text-anchor="middle" font-size="14" fill="#666">The number being divided</text></svg>`,
  divisor: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><text x="150" y="80" text-anchor="middle" font-size="16" fill="#333" font-weight="700">432 / 6 = 72</text><rect x="55" y="100" width="80" height="60" rx="10" fill="#999"/><text x="95" y="140" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">432</text><text x="145" y="140" text-anchor="middle" font-size="24" fill="#333">/</text><rect x="155" y="100" width="60" height="60" rx="10" fill="#d4952a"/><text x="185" y="140" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">6</text><path d="M185 170 L185 200" stroke="#d4952a" stroke-width="2"/><text x="185" y="225" text-anchor="middle" font-size="16" fill="#d4952a" font-weight="700">divisor</text><text x="150" y="270" text-anchor="middle" font-size="14" fill="#666">The number you divide by</text></svg>`,
  quotient: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="80" text-anchor="middle" font-size="16" fill="#333" font-weight="700">432 / 6 = 72</text><rect x="55" y="100" width="80" height="60" rx="10" fill="#999"/><text x="95" y="140" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">432</text><text x="145" y="140" text-anchor="middle" font-size="24" fill="#333">/</text><rect x="155" y="100" width="60" height="60" rx="10" fill="#999"/><text x="185" y="140" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">6</text><text x="230" y="140" text-anchor="middle" font-size="24" fill="#333">=</text><rect x="240" y="100" width="50" height="60" rx="10" fill="#0e8a7d"/><text x="265" y="140" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">72</text><path d="M265 170 L265 200" stroke="#0e8a7d" stroke-width="2"/><text x="230" y="225" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">quotient</text><text x="150" y="270" text-anchor="middle" font-size="14" fill="#666">The answer to a division problem</text></svg>`,
  remainder: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdeee9"/><text x="150" y="70" text-anchor="middle" font-size="16" fill="#333" font-weight="700">13 / 4 = 3 R 1</text><rect x="30" y="100" width="50" height="50" rx="6" fill="#1a6fb5"/><rect x="85" y="100" width="50" height="50" rx="6" fill="#1a6fb5"/><rect x="140" y="100" width="50" height="50" rx="6" fill="#1a6fb5"/><text x="55" y="130" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">4</text><text x="110" y="130" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">4</text><text x="165" y="130" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">4</text><circle cx="230" cy="125" r="22" fill="#c45a3c" opacity="0.8"/><text x="230" y="132" text-anchor="middle" font-size="18" fill="#fff" font-weight="700">1</text><text x="230" y="175" text-anchor="middle" font-size="14" fill="#c45a3c" font-weight="700">leftover!</text><text x="150" y="230" text-anchor="middle" font-size="15" fill="#333" font-weight="700">What is left over</text></svg>`,
  // Coordinate Plane
  "coordinate plane": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><line x1="150" y1="30" x2="150" y2="260" stroke="#333" stroke-width="2"/><line x1="30" y1="150" x2="270" y2="150" stroke="#333" stroke-width="2"/><text x="160" y="45" font-size="12" fill="#333" font-weight="700">y</text><text x="260" y="145" font-size="12" fill="#333" font-weight="700">x</text><text x="200" y="95" text-anchor="middle" font-size="14" fill="#0e8a7d" font-weight="700">I</text><text x="100" y="95" text-anchor="middle" font-size="14" fill="#1a6fb5" font-weight="700">II</text><text x="100" y="210" text-anchor="middle" font-size="14" fill="#c45a3c" font-weight="700">III</text><text x="200" y="210" text-anchor="middle" font-size="14" fill="#d4952a" font-weight="700">IV</text><circle cx="200" cy="100" r="5" fill="#c45a3c"/><text x="215" y="100" font-size="10" fill="#c45a3c">(3,2)</text><text x="145" y="165" text-anchor="end" font-size="11" fill="#333">0</text><text x="150" y="280" text-anchor="middle" font-size="13" fill="#666">4 quadrants, x and y axes</text></svg>`,
  "ordered pair": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="80" text-anchor="middle" font-size="36" fill="#333" font-weight="700">(3, 4)</text><path d="M115 95 L115 120" stroke="#c45a3c" stroke-width="2"/><text x="115" y="145" text-anchor="middle" font-size="16" fill="#c45a3c" font-weight="700">x</text><text x="115" y="165" text-anchor="middle" font-size="12" fill="#c45a3c">right 3</text><path d="M175 95 L175 120" stroke="#0e8a7d" stroke-width="2"/><text x="175" y="145" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">y</text><text x="175" y="165" text-anchor="middle" font-size="12" fill="#0e8a7d">up 4</text><text x="150" y="220" text-anchor="middle" font-size="15" fill="#333" font-weight="700">x first, then y</text><text x="150" y="250" text-anchor="middle" font-size="14" fill="#666">Location on the grid</text></svg>`,
  origin: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><line x1="150" y1="50" x2="150" y2="240" stroke="#333" stroke-width="2"/><line x1="50" y1="150" x2="250" y2="150" stroke="#333" stroke-width="2"/><circle cx="150" cy="150" r="14" fill="#d4952a" stroke="#fff" stroke-width="3"/><text x="150" y="156" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">O</text><text x="175" y="175" font-size="16" fill="#d4952a" font-weight="700">(0, 0)</text><text x="150" y="270" text-anchor="middle" font-size="14" fill="#666">Where x and y axes meet</text></svg>`,
  quadrant: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><line x1="150" y1="40" x2="150" y2="250" stroke="#333" stroke-width="2"/><line x1="40" y1="150" x2="260" y2="150" stroke="#333" stroke-width="2"/><rect x="155" y="45" width="100" height="100" rx="6" fill="#0e8a7d" opacity="0.2"/><text x="205" y="100" text-anchor="middle" font-size="20" fill="#0e8a7d" font-weight="700">I</text><text x="205" y="115" text-anchor="middle" font-size="10" fill="#0e8a7d">(+,+)</text><rect x="45" y="45" width="100" height="100" rx="6" fill="#1a6fb5" opacity="0.2"/><text x="95" y="100" text-anchor="middle" font-size="20" fill="#1a6fb5" font-weight="700">II</text><text x="95" y="115" text-anchor="middle" font-size="10" fill="#1a6fb5">(-,+)</text><rect x="45" y="155" width="100" height="90" rx="6" fill="#c45a3c" opacity="0.2"/><text x="95" y="200" text-anchor="middle" font-size="20" fill="#c45a3c" font-weight="700">III</text><text x="95" y="215" text-anchor="middle" font-size="10" fill="#c45a3c">(-,-)</text><rect x="155" y="155" width="100" height="90" rx="6" fill="#d4952a" opacity="0.2"/><text x="205" y="200" text-anchor="middle" font-size="20" fill="#d4952a" font-weight="700">IV</text><text x="205" y="215" text-anchor="middle" font-size="10" fill="#d4952a">(+,-)</text><text x="150" y="280" text-anchor="middle" font-size="13" fill="#666">4 sections, numbered I-IV</text></svg>`,
  "x-axis": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><line x1="150" y1="50" x2="150" y2="230" stroke="#ccc" stroke-width="1"/><line x1="40" y1="150" x2="260" y2="150" stroke="#c45a3c" stroke-width="5"/><polygon points="255,145 265,150 255,155" fill="#c45a3c"/><text x="260" y="140" font-size="16" fill="#c45a3c" font-weight="700">x</text><text x="100" y="170" text-anchor="middle" font-size="12" fill="#333">-2  -1</text><text x="150" y="170" text-anchor="middle" font-size="12" fill="#333">0</text><text x="200" y="170" text-anchor="middle" font-size="12" fill="#333">1   2</text><text x="150" y="250" text-anchor="middle" font-size="15" fill="#c45a3c" font-weight="700">Horizontal line</text></svg>`,
  "y-axis": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><line x1="40" y1="150" x2="260" y2="150" stroke="#ccc" stroke-width="1"/><line x1="150" y1="50" x2="150" y2="250" stroke="#0e8a7d" stroke-width="5"/><polygon points="145,55 150,40 155,55" fill="#0e8a7d"/><text x="165" y="55" font-size="16" fill="#0e8a7d" font-weight="700">y</text><text x="150" y="280" text-anchor="middle" font-size="15" fill="#0e8a7d" font-weight="700">Vertical line</text></svg>`,
  "x-axis / y-axis": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><line x1="40" y1="150" x2="260" y2="150" stroke="#c45a3c" stroke-width="4"/><text x="260" y="140" font-size="14" fill="#c45a3c" font-weight="700">x</text><line x1="150" y1="40" x2="150" y2="250" stroke="#0e8a7d" stroke-width="4"/><text x="165" y="50" font-size="14" fill="#0e8a7d" font-weight="700">y</text><circle cx="150" cy="150" r="5" fill="#333"/><text x="170" y="170" font-size="12" fill="#333">(0,0)</text><text x="100" y="140" text-anchor="middle" font-size="11" fill="#c45a3c">left/right</text><text x="135" y="100" text-anchor="end" font-size="11" fill="#0e8a7d">up/down</text><text x="150" y="280" text-anchor="middle" font-size="13" fill="#666">Two perpendicular number lines</text></svg>`,
  // Decimals
  decimal: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="110" text-anchor="middle" font-size="40" fill="#333" font-weight="700">3<tspan fill="#c45a3c">.</tspan>75</text><text x="95" y="150" font-size="14" fill="#333">ones</text><text x="145" y="150" font-size="14" fill="#c45a3c" font-weight="700">point</text><text x="195" y="150" font-size="14" fill="#333">tenths</text><text x="150" y="210" text-anchor="middle" font-size="15" fill="#0e8a7d" font-weight="700">Part of a whole number</text></svg>`,
  sum: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><rect x="50" y="80" width="80" height="60" rx="8" fill="#1a6fb5"/><text x="90" y="118" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">5</text><text x="145" y="118" text-anchor="middle" font-size="28" fill="#333">+</text><rect x="160" y="80" width="80" height="60" rx="8" fill="#1a6fb5"/><text x="200" y="118" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">3</text><text x="145" y="180" text-anchor="middle" font-size="20" fill="#333">=</text><rect x="100" y="195" width="90" height="50" rx="8" fill="#0e8a7d"/><text x="145" y="228" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">8</text><text x="150" y="280" text-anchor="middle" font-size="14" fill="#666">Result of adding</text></svg>`,
  difference: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdeee9"/><rect x="50" y="80" width="80" height="60" rx="8" fill="#c45a3c"/><text x="90" y="118" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">9</text><text x="145" y="118" text-anchor="middle" font-size="28" fill="#333">-</text><rect x="160" y="80" width="80" height="60" rx="8" fill="#c45a3c"/><text x="200" y="118" text-anchor="middle" font-size="24" fill="#fff" font-weight="700">4</text><text x="145" y="180" text-anchor="middle" font-size="20" fill="#333">=</text><rect x="100" y="195" width="90" height="50" rx="8" fill="#0e8a7d"/><text x="145" y="228" text-anchor="middle" font-size="28" fill="#fff" font-weight="700">5</text><text x="150" y="280" text-anchor="middle" font-size="14" fill="#666">Result of subtracting</text></svg>`,
  // Misc
  "independent variable": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><rect x="80" y="70" width="140" height="70" rx="12" fill="#d4952a"/><text x="150" y="100" text-anchor="middle" font-size="16" fill="#fff" font-weight="700">You CHOOSE it</text><text x="150" y="125" text-anchor="middle" font-size="14" fill="#fff">INPUT</text><text x="150" y="180" text-anchor="middle" font-size="18" fill="#333" font-weight="700">hours driven</text><text x="150" y="210" text-anchor="middle" font-size="14" fill="#666">The cause - what you control</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#d4952a" font-weight="700">First column of a table</text></svg>`,
  "dependent variable": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><rect x="80" y="70" width="140" height="70" rx="12" fill="#0e8a7d"/><text x="150" y="100" text-anchor="middle" font-size="16" fill="#fff" font-weight="700">It CHANGES</text><text x="150" y="125" text-anchor="middle" font-size="14" fill="#fff">OUTPUT</text><text x="150" y="180" text-anchor="middle" font-size="18" fill="#333" font-weight="700">miles traveled</text><text x="150" y="210" text-anchor="middle" font-size="14" fill="#666">The effect - depends on the input</text><text x="150" y="260" text-anchor="middle" font-size="14" fill="#0e8a7d" font-weight="700">Second column of a table</text></svg>`,
  "rational number": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="150" y="60" text-anchor="middle" font-size="16" fill="#1a6fb5" font-weight="700">Rational Numbers</text><ellipse cx="150" cy="160" rx="130" ry="80" fill="#1a6fb5" opacity="0.1" stroke="#1a6fb5" stroke-width="2"/><text x="70" y="145" font-size="18" fill="#333" font-weight="700">-3</text><text x="120" y="175" font-size="18" fill="#333" font-weight="700">1/2</text><text x="170" y="140" font-size="18" fill="#333" font-weight="700">0.75</text><text x="220" y="170" font-size="18" fill="#333" font-weight="700">4</text><text x="150" y="200" font-size="14" fill="#333">0</text><text x="150" y="265" text-anchor="middle" font-size="14" fill="#666">Can be written as a fraction</text></svg>`,
  positive: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e6f4eb"/><line x1="30" y1="150" x2="270" y2="150" stroke="#333" stroke-width="2"/><circle cx="130" cy="150" r="6" fill="#333"/><text x="130" y="175" text-anchor="middle" font-size="14" fill="#333">0</text><rect x="145" y="135" width="110" height="30" rx="6" fill="#2d874b" opacity="0.3"/><circle cx="170" cy="150" r="8" fill="#2d874b"/><text x="170" y="175" text-anchor="middle" font-size="14" fill="#2d874b" font-weight="700">1</text><circle cx="210" cy="150" r="8" fill="#2d874b"/><text x="210" y="175" text-anchor="middle" font-size="14" fill="#2d874b" font-weight="700">2</text><text x="150" y="80" text-anchor="middle" font-size="22" fill="#2d874b" font-weight="700">+1, +2, +3...</text><text x="150" y="230" text-anchor="middle" font-size="15" fill="#333">Greater than zero</text></svg>`,
  negative: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdeee9"/><line x1="30" y1="150" x2="270" y2="150" stroke="#333" stroke-width="2"/><circle cx="170" cy="150" r="6" fill="#333"/><text x="170" y="175" text-anchor="middle" font-size="14" fill="#333">0</text><rect x="45" y="135" width="110" height="30" rx="6" fill="#c45a3c" opacity="0.3"/><circle cx="90" cy="150" r="8" fill="#c45a3c"/><text x="90" y="175" text-anchor="middle" font-size="14" fill="#c45a3c" font-weight="700">-2</text><circle cx="130" cy="150" r="8" fill="#c45a3c"/><text x="130" y="175" text-anchor="middle" font-size="14" fill="#c45a3c" font-weight="700">-1</text><text x="150" y="80" text-anchor="middle" font-size="22" fill="#c45a3c" font-weight="700">-1, -2, -3...</text><text x="150" y="230" text-anchor="middle" font-size="15" fill="#333">Less than zero</text></svg>`,
  zero: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><line x1="30" y1="150" x2="270" y2="150" stroke="#333" stroke-width="2"/><circle cx="150" cy="150" r="18" fill="#d4952a" stroke="#fff" stroke-width="3"/><text x="150" y="158" text-anchor="middle" font-size="22" fill="#fff" font-weight="700">0</text><text x="90" y="195" text-anchor="middle" font-size="14" fill="#c45a3c">negative</text><text x="210" y="195" text-anchor="middle" font-size="14" fill="#2d874b">positive</text><text x="150" y="240" text-anchor="middle" font-size="15" fill="#333" font-weight="700">Neither positive nor negative</text></svg>`,
  // Decimals for unit-4
  "place value": `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><text x="60" y="100" font-size="30" fill="#1a6fb5" font-weight="700">3</text><text x="100" y="100" font-size="30" fill="#0e8a7d" font-weight="700">.</text><text x="130" y="100" font-size="30" fill="#d4952a" font-weight="700">4</text><text x="170" y="100" font-size="30" fill="#c45a3c" font-weight="700">5</text><text x="60" y="140" text-anchor="middle" font-size="11" fill="#1a6fb5" font-weight="700">ones</text><text x="130" y="140" text-anchor="middle" font-size="11" fill="#d4952a" font-weight="700">tenths</text><text x="170" y="140" text-anchor="middle" font-size="11" fill="#c45a3c" font-weight="700">hundredths</text><text x="150" y="210" text-anchor="middle" font-size="15" fill="#333" font-weight="700">Each digit has a position</text></svg>`,
  estimate: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e4f5f3"/><text x="150" y="90" text-anchor="middle" font-size="18" fill="#333">3.87 + 2.14</text><text x="150" y="130" text-anchor="middle" font-size="16" fill="#0e8a7d" font-weight="700">~ 4 + 2 = 6</text><text x="150" y="190" text-anchor="middle" font-size="40" fill="#0e8a7d" font-weight="700">~6</text><text x="150" y="250" text-anchor="middle" font-size="14" fill="#666">A close answer, not exact</text></svg>`,
  algorithm: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#fdf3e0"/><rect x="80" y="50" width="140" height="35" rx="6" fill="#d4952a"/><text x="150" y="73" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">Step 1</text><path d="M150 85 L150 100" stroke="#333" stroke-width="2"/><rect x="80" y="100" width="140" height="35" rx="6" fill="#d4952a"/><text x="150" y="123" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">Step 2</text><path d="M150 135 L150 150" stroke="#333" stroke-width="2"/><rect x="80" y="150" width="140" height="35" rx="6" fill="#d4952a"/><text x="150" y="173" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">Step 3</text><path d="M150 185 L150 200" stroke="#333" stroke-width="2"/><rect x="80" y="200" width="140" height="35" rx="6" fill="#0e8a7d"/><text x="150" y="223" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">Answer!</text><text x="150" y="270" text-anchor="middle" font-size="14" fill="#666">A set of steps to solve a problem</text></svg>`,
  // Default fallback
  _default: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="20" fill="#e8f2fc"/><circle cx="150" cy="120" r="50" fill="#1a6fb5" opacity="0.2" stroke="#1a6fb5" stroke-width="3"/><text x="150" y="130" text-anchor="middle" font-size="36" fill="#1a6fb5" font-weight="700">?</text><rect x="60" y="190" width="180" height="5" rx="2" fill="#ddd"/><rect x="80" y="210" width="140" height="5" rx="2" fill="#ddd"/><rect x="100" y="230" width="100" height="5" rx="2" fill="#ddd"/><text x="150" y="275" text-anchor="middle" font-size="14" fill="#666">Math vocabulary word</text></svg>`,
};

function getSvgForTerm(term) {
  const lower = term.toLowerCase().trim();
  // Try exact match first
  if (SVG_LIBRARY[lower]) return SVG_LIBRARY[lower];
  // Try partial matches
  for (const key of Object.keys(SVG_LIBRARY)) {
    if (key !== "_default" && (lower.includes(key) || key.includes(lower))) {
      return SVG_LIBRARY[key];
    }
  }
  return SVG_LIBRARY["_default"];
}

// Generate the vocab intro slideshow HTML/CSS/JS
function generateVocabIntro(words, id) {
  const prefix = `vi_${id}`;
  const wordsJson = JSON.stringify(
    words.map((w) => ({
      term: w.term,
      def: w.def,
      svg: getSvgForTerm(w.term),
    })),
  );

  return `
<!-- ═══════ VOCAB INTRO SLIDESHOW ═══════ -->
<div id="${prefix}_overlay" style="position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Inter',system-ui,sans-serif;overflow:auto;">
<style>
#${prefix}_overlay *{box-sizing:border-box}
.${prefix}_slide{display:none;flex-direction:column;align-items:center;text-align:center;padding:24px;max-width:680px;width:100%;animation:${prefix}_fadeIn .4s ease}
.${prefix}_slide.active{display:flex}
@keyframes ${prefix}_fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.${prefix}_progress{position:fixed;top:0;left:0;right:0;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;background:rgba(15,23,42,0.9);backdrop-filter:blur(8px);z-index:10000}
.${prefix}_progress-text{color:#94a3b8;font-size:14px;font-weight:600}
.${prefix}_dots{display:flex;gap:8px}
.${prefix}_dot{width:12px;height:12px;border-radius:50%;background:#334155;transition:.3s}
.${prefix}_dot.seen{background:#0e8a7d}
.${prefix}_dot.active{background:#38bdf8;box-shadow:0 0 12px #38bdf844}
.${prefix}_word{font-size:clamp(36px,8vw,64px);font-weight:800;color:#f1f5f9;margin:12px 0 8px;line-height:1.1}
.${prefix}_def{font-size:clamp(16px,3.5vw,22px);color:#94a3b8;line-height:1.5;margin-bottom:20px;max-width:560px;font-weight:500}
.${prefix}_svg-wrap{width:min(320px,80vw);height:min(320px,80vw);margin:0 auto 20px;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.3)}
.${prefix}_svg-wrap svg{width:100%;height:100%;display:block}
.${prefix}_nav{display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;justify-content:center}
.${prefix}_btn{padding:12px 28px;border-radius:12px;border:none;font-size:16px;font-weight:700;cursor:pointer;transition:.2s;font-family:inherit}
.${prefix}_btn:hover{transform:translateY(-2px)}
.${prefix}_btn-prev{background:#334155;color:#e2e8f0}
.${prefix}_btn-prev:hover{background:#475569}
.${prefix}_btn-next{background:#0e8a7d;color:#fff}
.${prefix}_btn-next:hover{background:#0d7d72}
.${prefix}_btn-start{background:linear-gradient(135deg,#0e8a7d,#38bdf8);color:#fff;font-size:18px;padding:16px 40px;box-shadow:0 4px 20px rgba(14,138,125,.4)}
.${prefix}_btn-start:hover{box-shadow:0 6px 28px rgba(14,138,125,.6)}
.${prefix}_title-bar{color:#38bdf8;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
</style>
<div class="${prefix}_progress">
  <span class="${prefix}_progress-text" id="${prefix}_counter">Word 1 of ${words.length}</span>
  <div class="${prefix}_dots" id="${prefix}_dots"></div>
</div>
<div id="${prefix}_slides"></div>
<script>
(function(){
  var W=${wordsJson};
  var cur=0, seen=new Set();
  var slides=document.getElementById('${prefix}_slides');
  var dots=document.getElementById('${prefix}_dots');
  var counter=document.getElementById('${prefix}_counter');

  // Build slides
  W.forEach(function(w,i){
    var d=document.createElement('div');
    d.className='${prefix}_slide'+(i===0?' active':'');
    d.id='${prefix}_s'+i;
    var isLast=i===W.length-1;
    d.innerHTML='<div class="${prefix}_title-bar">Vocabulary Preview</div>'
      +'<div class="${prefix}_word">'+w.term+'</div>'
      +'<div class="${prefix}_def">'+w.def+'</div>'
      +'<div class="${prefix}_svg-wrap">'+w.svg+'</div>'
      +'<div class="${prefix}_nav">'
      +(i>0?'<button class="${prefix}_btn ${prefix}_btn-prev" onclick="${prefix}_go('+(i-1)+')">\\u2190 Previous Word</button>':'')
      +(isLast?'<button class="${prefix}_btn ${prefix}_btn-start" id="${prefix}_startBtn" onclick="${prefix}_done()">Start Activities \\u2192</button>'
              :'<button class="${prefix}_btn ${prefix}_btn-next" onclick="${prefix}_go('+(i+1)+')">Next Word \\u2192</button>')
      +'</div>';
    slides.appendChild(d);
    var dot=document.createElement('div');
    dot.className='${prefix}_dot'+(i===0?' active':'');
    dot.id='${prefix}_d'+i;
    dots.appendChild(dot);
  });
  seen.add(0);
  document.getElementById('${prefix}_d0').classList.add('seen');
  checkStart();

  window['${prefix}_go']=function(n){
    document.getElementById('${prefix}_s'+cur).classList.remove('active');
    document.getElementById('${prefix}_d'+cur).classList.remove('active');
    cur=n;
    seen.add(cur);
    document.getElementById('${prefix}_s'+cur).classList.add('active');
    document.getElementById('${prefix}_d'+cur).classList.add('active','seen');
    counter.textContent='Word '+(cur+1)+' of '+W.length;
    checkStart();
  };
  function checkStart(){
    var btn=document.getElementById('${prefix}_startBtn');
    if(btn&&seen.size<W.length){btn.style.opacity='0.5';btn.style.cursor='not-allowed';btn.onclick=function(){alert('Please view all '+W.length+' words first!');}}
    else if(btn){btn.style.opacity='1';btn.style.cursor='pointer';btn.onclick=function(){window['${prefix}_done']();};}
  }
  window['${prefix}_done']=function(){
    if(seen.size<W.length){alert('Please view all '+W.length+' words first! You have seen '+seen.size+'.');return;}
    document.getElementById('${prefix}_overlay').style.display='none';
    document.body.style.overflow='';
  };
})();
</script>
</div>
<!-- ═══════ END VOCAB INTRO SLIDESHOW ═══════ -->
`;
}

// ─── FILE PROCESSING ────────────────────────────────────────

const BASE = "/Users/joelneft/neft-classroom-html-activities";

// Files with VOCAB_DATA JS arrays
function processVocabDataFiles() {
  const files = [
    `${BASE}/math/unit-1/6-ns-b-3review/index.html`,
    `${BASE}/math/unit-7/6-ns-c-3review/index.html`,
  ];
  let count = 0;
  for (const filePath of files) {
    try {
      let html = fs.readFileSync(filePath, "utf8");
      if (html.includes("VOCAB INTRO SLIDESHOW")) {
        console.log(`SKIP (already done): ${filePath}`);
        continue;
      }

      // Extract VOCAB_DATA array
      const match = html.match(/const VOCAB_DATA=\[([\s\S]*?)\];/);
      if (!match) {
        console.log(`NO VOCAB_DATA: ${filePath}`);
        continue;
      }
      const words = [];
      const pairs = match[1].matchAll(/\{term:'([^']+)',def:'([^']+)'\}/g);
      for (const p of pairs) {
        words.push({ term: p[1], def: p[2] });
      }
      if (words.length === 0) {
        console.log(`NO WORDS EXTRACTED: ${filePath}`);
        continue;
      }

      const id = path
        .basename(path.dirname(filePath))
        .replace(/[^a-zA-Z0-9]/g, "");
      const intro = generateVocabIntro(words, id);

      // Insert after <body> tag or after opening header
      html = html.replace(/(<body[^>]*>)/i, `$1\n${intro}`);
      fs.writeFileSync(filePath, html, "utf8");
      console.log(`OK (${words.length} words): ${filePath}`);
      count++;
    } catch (e) {
      console.error(`ERR: ${filePath}: ${e.message}`);
    }
  }
  return count;
}

// Files with HTML vocab cards (vocab-term/vocab-def, vc-term/vc-def)
function processHtmlVocabCards() {
  const files = [
    `${BASE}/math/unit-1/6-ns-b-2reviewactivities/index.html`,
    `${BASE}/math/unit-7/6-ns-cstudypractice/index.html`,
    `${BASE}/math/unit-4/6-rp-a-2-interactive-study-guide/index.html`,
    `${BASE}/statistics-data/2-2histogramgraphicnovel/index.html`,
    `${BASE}/statistics-data/histogramhero/index.html`,
    `${BASE}/math/statistics/6-sp-b-5-interactive-review/index.html`,
    `${BASE}/math/statistics/mean-median-modegallerywalk/index.html`,
    `${BASE}/unit-4/decimaloperationsreview/index.html`,
    `${BASE}/unit-5/grade6area5-1-2/index.html`,
    `${BASE}/unit-5/grade6area5-1-2language/index.html`,
    `${BASE}/unit-5/5-6session1/index.html`,
    `${BASE}/math/unit-3/study-guide/index.html`,
    `${BASE}/math/unit-7/study-guide/index.html`,
    `${BASE}/math/unit-8/study-guide/index.html`,
    `${BASE}/math/unit-8/review/index.html`,
  ];
  let count = 0;
  for (const filePath of files) {
    try {
      let html = fs.readFileSync(filePath, "utf8");
      if (html.includes("VOCAB INTRO SLIDESHOW")) {
        console.log(`SKIP (already done): ${filePath}`);
        continue;
      }

      const words = [];

      // Pattern 1: <div class="vocab-term">X</div><div class="vocab-def">Y</div>
      const p1 = html.matchAll(
        /<div class="vocab-term">([^<]+)<\/div>\s*<div class="vocab-def">([^<]+)<\/div>/g,
      );
      for (const m of p1) words.push({ term: m[1].trim(), def: m[2].trim() });

      // Pattern 2: <div class="vc-term">X</div>...<div class="vc-def">Y</div>
      const p2 = html.matchAll(
        /<div class="vc-term">([^<]+)<\/div>[\s\S]*?<div class="vc-def">([^<]+)<\/div>/g,
      );
      for (const m of p2) words.push({ term: m[1].trim(), def: m[2].trim() });

      // Pattern 3: vocab-card with data-def attribute
      const p3 = html.matchAll(
        /class="vocab-card"[^>]*data-def="([^"]+)"[\s\S]*?<div class="vocab-word">([^<]+)<\/div>/g,
      );
      for (const m of p3) words.push({ term: m[2].trim(), def: m[1].trim() });

      // Pattern 4: flip cards with .term and .def
      const p4 = html.matchAll(
        /<div class="term">([^<]+)<\/div>\s*<div class="def">\s*([^<]+)/g,
      );
      for (const m of p4) words.push({ term: m[1].trim(), def: m[2].trim() });

      // Pattern 5: <div class="vocab-card"><b>X</b> Y</div>
      const p5 = html.matchAll(
        /<div class="vocab-card"><b>([^<]+)<\/b>\s*([^<]+)<\/div>/g,
      );
      for (const m of p5) words.push({ term: m[1].trim(), def: m[2].trim() });

      // Pattern 6: drag-drop vocab match (word bank + definitions)
      const wordBank = html.matchAll(
        /<div class="word"[^>]*data-word="([^"]+)">([^<]+)<\/div>/g,
      );
      const defs6 = html.matchAll(
        /<div class="drop"[^>]*data-answer="([^"]+)"[^>]*><div class="label">([^<]+)<\/div>/g,
      );
      const defMap = {};
      for (const m of defs6) defMap[m[1]] = m[2];
      for (const m of wordBank) {
        if (defMap[m[1]]) {
          words.push({ term: m[2].trim(), def: defMap[m[1]].trim() });
        }
      }

      // Pattern 7: vocab-table rows (unit-4)
      const p7 = html.matchAll(
        /<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/g,
      );
      // Only use if we're in a file that has "Decimal Vocabulary Chart" or similar
      if (html.includes("Vocabulary Chart") || html.includes("vocab-table")) {
        const tableMatch = html.match(
          /<table class="vocab-table">([\s\S]*?)<\/table>/,
        );
        if (tableMatch) {
          const rows = tableMatch[1].matchAll(
            /<tr>\s*<td[^>]*>\s*([^<]+?)\s*<\/td>\s*<td[^>]*>\s*([^<]+?)\s*<\/td>/g,
          );
          for (const r of rows) {
            if (r[1].trim() !== "Word" && r[1].trim() !== "Term") {
              words.push({ term: r[1].trim(), def: r[2].trim() });
            }
          }
        }
      }

      // Pattern 8: Key Vocabulary section with term+def in review file
      const p8Match = html.match(
        /<h3>Key Vocabulary<\/h3>([\s\S]*?)(?:<\/section>|<h3>)/,
      );
      if (p8Match) {
        const p8 = p8Match[1].matchAll(
          /<strong>([^<]+)<\/strong>[:\s]*([^<]+)/g,
        );
        for (const m of p8) words.push({ term: m[1].trim(), def: m[2].trim() });
      }

      // Deduplicate
      const seen = new Set();
      const unique = words.filter((w) => {
        const key = w.term.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (unique.length === 0) {
        console.log(`NO WORDS: ${filePath}`);
        continue;
      }

      const id = path
        .basename(path.dirname(filePath))
        .replace(/[^a-zA-Z0-9]/g, "");
      const intro = generateVocabIntro(unique, id);
      html = html.replace(/(<body[^>]*>)/i, `$1\n${intro}`);
      fs.writeFileSync(filePath, html, "utf8");
      console.log(`OK (${unique.length} words): ${filePath}`);
      count++;
    } catch (e) {
      console.error(`ERR: ${filePath}: ${e.message}`);
    }
  }
  return count;
}

// Files with inline <span class="vocab"> tags (math/unit-* lesson files)
function processInlineVocabFiles() {
  const files = [
    // Unit 3
    `${BASE}/math/unit-3/3-1-understand-ratios/index.html`,
    `${BASE}/math/unit-3/3-2-rates-unit-rates/index.html`,
    `${BASE}/math/unit-3/3-3-equivalent-ratios-tables/index.html`,
    // Unit 7
    `${BASE}/math/unit-7/7-1-explore-integers-opposites/index.html`,
    `${BASE}/math/unit-7/7-2-rational-numbers-number-line/index.html`,
    `${BASE}/math/unit-7/7-3-absolute-value/index.html`,
    `${BASE}/math/unit-7/7-4-compare-order-rational-numbers/index.html`,
    `${BASE}/math/unit-7/7-5-rational-numbers-coordinate-plane/index.html`,
    `${BASE}/math/unit-7/7-6-distance-coordinate-plane/index.html`,
    `${BASE}/math/unit-7/7-7-polygons-coordinate-plane/index.html`,
    // Unit 8
    `${BASE}/math/unit-8/8-1-understand-equations/index.html`,
    `${BASE}/math/unit-8/8-2-addition-subtraction-equations/index.html`,
    `${BASE}/math/unit-8/8-3-multiplication-division-equations/index.html`,
    `${BASE}/math/unit-8/8-4-write-represent-inequalities/index.html`,
    `${BASE}/math/unit-8/8-5-understand-inequality-solutions/index.html`,
  ];

  // Predefined vocab for inline-vocab files (these files embed vocab in scaffolding)
  const vocabSets = {
    "3-1-understand-ratios": [
      {
        term: "Ratio",
        def: "A comparison of two quantities, like 3 to 5 or 3:5.",
      },
      {
        term: "Part-to-Part Ratio",
        def: "Compares one part of a group to another part (e.g., boys to girls).",
      },
      {
        term: "Part-to-Whole Ratio",
        def: "Compares one part to the entire group (e.g., boys to total students).",
      },
    ],
    "3-2-rates-unit-rates": [
      {
        term: "Rate",
        def: "A ratio that compares two quantities with different units, like miles per hour.",
      },
      {
        term: "Unit Rate",
        def: "A rate with a denominator of 1, telling you the amount per one unit.",
      },
      {
        term: "Per",
        def: 'Means "for each one" - the key word that signals a unit rate.',
      },
    ],
    "3-3-equivalent-ratios-tables": [
      {
        term: "Equivalent Ratio",
        def: "Ratios that show the same relationship, found by multiplying or dividing both parts by the same number.",
      },
      {
        term: "Ratio Table",
        def: "A table that lists pairs of equivalent ratios.",
      },
      {
        term: "Proportion",
        def: "An equation showing two ratios are equal, like 2/3 = 4/6.",
      },
    ],
    "7-1-explore-integers-opposites": [
      {
        term: "Integer",
        def: "Any whole number, including positive numbers, negative numbers, and zero.",
      },
      {
        term: "Positive",
        def: "Numbers greater than zero, to the right of 0 on a number line.",
      },
      {
        term: "Negative",
        def: "Numbers less than zero, to the left of 0 on a number line.",
      },
      {
        term: "Zero",
        def: "The number in the middle of the number line. It is neither positive nor negative.",
      },
      {
        term: "Opposite",
        def: "Two numbers the same distance from zero but on different sides, like 7 and -7.",
      },
    ],
    "7-2-rational-numbers-number-line": [
      {
        term: "Rational Number",
        def: "Any number that can be written as a fraction, including integers, decimals, and fractions.",
      },
      {
        term: "Number Line",
        def: "A line where every point stands for a real number.",
      },
      {
        term: "Opposite",
        def: "Two numbers the same distance from zero but on different sides.",
      },
    ],
    "7-3-absolute-value": [
      {
        term: "Absolute Value",
        def: "The distance of a number from zero on the number line. Always positive or zero. Written |x|.",
      },
      {
        term: "Distance",
        def: "How far apart two points are. Distance is always positive.",
      },
      {
        term: "Integer",
        def: "A whole number (positive, negative, or zero) with no fractions or decimals.",
      },
    ],
    "7-4-compare-order-rational-numbers": [
      {
        term: "Inequality",
        def: "A statement that compares two values using symbols like < or >.",
      },
      {
        term: "Number Line",
        def: "A line where every point stands for a real number, used to compare and order.",
      },
      {
        term: "Rational Number",
        def: "Any number that can be written as a fraction, including decimals and integers.",
      },
    ],
    "7-5-rational-numbers-coordinate-plane": [
      {
        term: "Coordinate Plane",
        def: "A flat surface formed by two perpendicular number lines (x-axis and y-axis).",
      },
      {
        term: "Ordered Pair",
        def: "Two numbers (x, y) that identify a point on the coordinate plane.",
      },
      {
        term: "Origin",
        def: "The point (0, 0) where the x-axis and y-axis cross.",
      },
      {
        term: "Quadrant",
        def: "One of four sections of the coordinate plane, numbered I through IV.",
      },
    ],
    "7-6-distance-coordinate-plane": [
      {
        term: "Absolute Value",
        def: "The distance from zero on a number line. Always positive or zero.",
      },
      {
        term: "Coordinate Plane",
        def: "A grid formed by the x-axis and y-axis, divided into four quadrants.",
      },
      {
        term: "Distance",
        def: "How far apart two points are, found using absolute value of coordinate differences.",
      },
    ],
    "7-7-polygons-coordinate-plane": [
      {
        term: "Polygon",
        def: "A closed flat shape made of straight line segments.",
      },
      {
        term: "Coordinate Plane",
        def: "A grid formed by perpendicular x and y axes used to plot points.",
      },
      {
        term: "Ordered Pair",
        def: "A pair of numbers (x, y) that shows where a point is on the grid.",
      },
      {
        term: "Perimeter",
        def: "The total distance around the outside of a shape.",
      },
    ],
    "8-1-understand-equations": [
      {
        term: "Equation",
        def: "A math sentence with an equals sign showing two expressions are equal.",
      },
      { term: "Variable", def: "A letter that represents an unknown number." },
      {
        term: "Solution",
        def: "The value that makes an equation true when you substitute it in.",
      },
    ],
    "8-2-addition-subtraction-equations": [
      {
        term: "Inverse Operation",
        def: "The opposite operation that undoes another. Addition undoes subtraction.",
      },
      {
        term: "Isolate",
        def: "To get the variable alone on one side of the equation.",
      },
      {
        term: "Variable",
        def: "A letter that stands for an unknown number you need to find.",
      },
    ],
    "8-3-multiplication-division-equations": [
      {
        term: "Coefficient",
        def: "The number multiplied by a variable, like the 4 in 4x.",
      },
      {
        term: "Inverse Operation",
        def: "Multiplication and division undo each other.",
      },
      { term: "Equation", def: "A math sentence with an equals sign." },
    ],
    "8-4-write-represent-inequalities": [
      {
        term: "Inequality",
        def: "A math sentence using >, <, >=, or <= to compare two expressions.",
      },
      {
        term: "Open Circle",
        def: "Used on a number line for > or < (value is NOT included).",
      },
      {
        term: "Closed Circle",
        def: "Used on a number line for >= or <= (value IS included).",
      },
      { term: "Variable", def: "A letter that represents an unknown number." },
    ],
    "8-5-understand-inequality-solutions": [
      {
        term: "Solution Set",
        def: "All the values that make an inequality true.",
      },
      {
        term: "Inequality",
        def: "A math sentence that compares using >, <, >=, or <=.",
      },
      {
        term: "Number Line",
        def: "A line used to graph solutions, showing which values work.",
      },
    ],
  };

  let count = 0;
  for (const filePath of files) {
    try {
      let html = fs.readFileSync(filePath, "utf8");
      if (html.includes("VOCAB INTRO SLIDESHOW")) {
        console.log(`SKIP (already done): ${filePath}`);
        continue;
      }

      const dirName = path.basename(path.dirname(filePath));
      const words = vocabSets[dirName];
      if (!words || words.length === 0) {
        console.log(`NO VOCAB SET: ${filePath}`);
        continue;
      }

      const id = dirName.replace(/[^a-zA-Z0-9]/g, "");
      const intro = generateVocabIntro(words, id);
      html = html.replace(/(<body[^>]*>)/i, `$1\n${intro}`);
      fs.writeFileSync(filePath, html, "utf8");
      console.log(`OK (${words.length} words): ${filePath}`);
      count++;
    } catch (e) {
      console.error(`ERR: ${filePath}: ${e.message}`);
    }
  }
  return count;
}

// Process the EE files
function processEEFiles() {
  const files = [
    {
      path: `${BASE}/math/unit-9/6-ee-9notespracti-e/index.html`,
      words: [
        {
          term: "Independent Variable",
          def: "The variable YOU control or change. It is the input.",
        },
        {
          term: "Dependent Variable",
          def: "The variable that changes because of the independent variable. It is the output.",
        },
      ],
    },
    {
      path: `${BASE}/math/unit-9/variablechartpractice/index.html`,
      words: null, // Will extract from file
    },
  ];
  let count = 0;
  for (const entry of files) {
    try {
      let html = fs.readFileSync(entry.path, "utf8");
      if (html.includes("VOCAB INTRO SLIDESHOW")) {
        console.log(`SKIP (already done): ${entry.path}`);
        continue;
      }

      let words = entry.words;
      if (!words) {
        // Try to extract from variablechartpractice
        words = [];
        // Check for phase-1 vocab match section
        const vocabMatch = html.matchAll(
          /<span class="vocab">([^<]+)<\/span>/g,
        );
        const seen = new Set();
        for (const m of vocabMatch) {
          const term = m[1].trim();
          if (!seen.has(term.toLowerCase())) {
            seen.add(term.toLowerCase());
            words.push({ term: term, def: "" });
          }
        }
        // For variablechartpractice, use predefined set since vocab is in a match game
        if (words.length === 0 || words.every((w) => !w.def)) {
          words = [
            {
              term: "Variable",
              def: "A letter or symbol that represents an unknown number.",
            },
            {
              term: "Expression",
              def: "A combination of numbers, variables, and operations with no equals sign.",
            },
            {
              term: "Equation",
              def: "A math sentence with an equals sign showing two sides are equal.",
            },
          ];
        }
      }

      if (words.length === 0) continue;
      const id = path
        .basename(path.dirname(entry.path))
        .replace(/[^a-zA-Z0-9]/g, "");
      const intro = generateVocabIntro(words, id);
      html = html.replace(/(<body[^>]*>)/i, `$1\n${intro}`);
      fs.writeFileSync(entry.path, html, "utf8");
      console.log(`OK (${words.length} words): ${entry.path}`);
      count++;
    } catch (e) {
      console.error(`ERR: ${entry.path}: ${e.message}`);
    }
  }
  return count;
}

// Process unit-5 files
function processUnit5Files() {
  const unit5Vocab = {
    "grade6area5-1-2": [
      {
        term: "Area",
        def: "The amount of space inside a flat shape, measured in square units.",
      },
      {
        term: "Parallelogram",
        def: "A 4-sided shape where opposite sides are parallel and equal.",
      },
      {
        term: "Base",
        def: "The bottom side of a shape, used in area formulas.",
      },
      {
        term: "Height",
        def: "The straight (perpendicular) distance from base to top.",
      },
    ],
    "grade6area5-1-2language": [
      {
        term: "Area",
        def: "The amount of space inside a flat shape, measured in square units.",
      },
      {
        term: "Parallelogram",
        def: "A 4-sided shape where opposite sides are parallel and equal.",
      },
      {
        term: "Base",
        def: "The bottom side of a shape, used in area formulas.",
      },
      {
        term: "Height",
        def: "The straight (perpendicular) distance from base to top.",
      },
    ],
    "trapezoid-area-studio-env": [
      {
        term: "Trapezoid",
        def: "A four-sided shape with exactly one pair of parallel sides.",
      },
      {
        term: "Base",
        def: "A parallel side of a trapezoid. Trapezoids have two bases (b1 and b2).",
      },
      {
        term: "Height",
        def: "The straight distance between the two parallel bases.",
      },
      {
        term: "Area",
        def: "The space inside the trapezoid. Formula: A = 1/2(b1 + b2) x h.",
      },
    ],
    "trapezoid-area-studio-rv": [
      {
        term: "Trapezoid",
        def: "A four-sided shape with exactly one pair of parallel sides.",
      },
      { term: "Base", def: "One of the parallel sides of a trapezoid." },
      {
        term: "Height",
        def: "The perpendicular distance between the two bases.",
      },
    ],
    "5-5squaretriangle": [
      {
        term: "Volume",
        def: "The amount of space inside a 3D shape, measured in cubic units.",
      },
      {
        term: "Rectangular Prism",
        def: "A 3D box shape with 6 rectangular faces.",
      },
      { term: "Base", def: "The face on the bottom of a 3D shape." },
    ],
    rectangularprismstory: [
      {
        term: "Rectangular Prism",
        def: "A 3D shape (like a box) with 6 rectangular faces.",
      },
      {
        term: "Volume",
        def: "The space inside a 3D shape. V = length x width x height.",
      },
      {
        term: "Surface Area",
        def: "The total area of all faces of a 3D shape.",
      },
    ],
    rectangularprismstoryesl: [
      {
        term: "Rectangular Prism",
        def: "A 3D shape (like a box) with 6 flat faces.",
      },
      {
        term: "Volume",
        def: "The space inside the box. V = length x width x height.",
      },
      { term: "Surface Area", def: "The total area of ALL the outside faces." },
    ],
    "5-8interactivehtml": [
      { term: "Volume", def: "The amount of space inside a 3D object." },
      {
        term: "Surface Area",
        def: "The total area covering the outside of a 3D shape.",
      },
    ],
    volumeofrectangularprism: [
      {
        term: "Volume",
        def: "The amount of space inside a 3D shape, measured in cubic units.",
      },
      {
        term: "Rectangular Prism",
        def: "A 3D box shape with length, width, and height.",
      },
      {
        term: "Base",
        def: "The bottom face of the prism; its area = length x width.",
      },
    ],
    unit5practicehtml: [
      {
        term: "Area",
        def: "The space inside a flat shape, measured in square units.",
      },
      {
        term: "Volume",
        def: "The space inside a 3D shape, measured in cubic units.",
      },
      {
        term: "Surface Area",
        def: "The total area of all faces of a 3D shape.",
      },
    ],
    unit5testreview: [
      { term: "Area", def: "The space inside a flat (2D) shape." },
      { term: "Volume", def: "The space inside a 3D shape." },
      {
        term: "Surface Area",
        def: "The total area of all outside faces of a 3D shape.",
      },
      {
        term: "Parallelogram",
        def: "A 4-sided shape with two pairs of parallel sides.",
      },
      {
        term: "Trapezoid",
        def: "A 4-sided shape with exactly one pair of parallel sides.",
      },
    ],
  };

  let count = 0;
  for (const [dir, words] of Object.entries(unit5Vocab)) {
    const filePath = `${BASE}/unit-5/${dir}/index.html`;
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`NOT FOUND: ${filePath}`);
        continue;
      }
      let html = fs.readFileSync(filePath, "utf8");
      if (html.includes("VOCAB INTRO SLIDESHOW")) {
        console.log(`SKIP (already done): ${filePath}`);
        continue;
      }

      const id = dir.replace(/[^a-zA-Z0-9]/g, "");
      const intro = generateVocabIntro(words, id);
      html = html.replace(/(<body[^>]*>)/i, `$1\n${intro}`);
      fs.writeFileSync(filePath, html, "utf8");
      console.log(`OK (${words.length} words): ${filePath}`);
      count++;
    } catch (e) {
      console.error(`ERR: ${filePath}: ${e.message}`);
    }
  }
  return count;
}

// Process remaining math/unit lesson files
function processRemainingMathFiles() {
  const vocabSets = {
    [`${BASE}/math/unit-3/index.html`]: [
      { term: "Ratio", def: "A comparison of two quantities." },
      {
        term: "Rate",
        def: "A ratio comparing quantities with different units.",
      },
      { term: "Unit Rate", def: "A rate where the denominator is 1." },
    ],
    [`${BASE}/math/unit-7/index.html`]: [
      {
        term: "Integer",
        def: "Whole numbers and their opposites: ...,-2,-1,0,1,2,...",
      },
      {
        term: "Absolute Value",
        def: "Distance from zero on a number line. Always positive or zero.",
      },
      {
        term: "Coordinate Plane",
        def: "A grid formed by x-axis and y-axis with four quadrants.",
      },
    ],
    [`${BASE}/math/unit-8/index.html`]: [
      { term: "Equation", def: "A math sentence with an equals sign." },
      { term: "Inequality", def: "A math sentence using >, <, >=, or <=." },
      { term: "Variable", def: "A letter that represents an unknown number." },
    ],
    [`${BASE}/math/unit-4/4-1-understand-percent/index.html`]: [
      {
        term: "Percent",
        def: 'A ratio that compares a number to 100. The symbol % means "per hundred."',
      },
      { term: "Ratio", def: "A comparison of two quantities using division." },
    ],
    [`${BASE}/math/unit-4/4-2-relate-fractions-decimals-percents/index.html`]: [
      {
        term: "Fraction",
        def: "A number showing part of a whole, written as a/b.",
      },
      {
        term: "Decimal",
        def: "A number with a decimal point showing parts less than one.",
      },
      { term: "Percent", def: "A number out of 100, shown with the % symbol." },
    ],
    [`${BASE}/math/unit-4/4-3-estimate-percent-of-number/index.html`]: [
      {
        term: "Estimate",
        def: "A close answer found using simpler numbers, not exact.",
      },
      { term: "Percent", def: "A number out of 100." },
      {
        term: "Benchmark Percent",
        def: "Common percents like 10%, 25%, 50%, 75% used to estimate quickly.",
      },
    ],
    [`${BASE}/math/unit-4/4-4-find-compare-percentages/index.html`]: [
      { term: "Percent", def: "A ratio out of 100." },
      { term: "Proportion", def: "An equation showing two ratios are equal." },
    ],
    [`${BASE}/math/unit-4/study-guide/index.html`]: [
      { term: "Percent", def: "A ratio that compares a number to 100." },
      { term: "Fraction", def: "A number representing part of a whole." },
      {
        term: "Decimal",
        def: "Another way to write fractions using place value.",
      },
      {
        term: "Proportion",
        def: "An equation that says two ratios are equal.",
      },
    ],
    [`${BASE}/math/unit-5/5-1-area-parallelograms-rhombuses/index.html`]: [
      {
        term: "Parallelogram",
        def: "A 4-sided shape where opposite sides are parallel and equal.",
      },
      {
        term: "Area",
        def: "The space inside a shape. For parallelograms: A = base x height.",
      },
      {
        term: "Base",
        def: "The bottom side of a shape used in the area formula.",
      },
      {
        term: "Height",
        def: "The perpendicular distance from the base to the opposite side.",
      },
    ],
    [`${BASE}/math/unit-5/5-2-area-triangles/index.html`]: [
      { term: "Triangle", def: "A shape with 3 sides and 3 angles." },
      {
        term: "Area",
        def: "Space inside a shape. For triangles: A = 1/2 x base x height.",
      },
      { term: "Base", def: "Any side of a triangle used in the area formula." },
      {
        term: "Height",
        def: "The perpendicular distance from the base to the opposite vertex.",
      },
    ],
    [`${BASE}/math/unit-5/5-3-area-trapezoids/index.html`]: [
      {
        term: "Trapezoid",
        def: "A 4-sided shape with exactly one pair of parallel sides (the bases).",
      },
      { term: "Area", def: "Space inside the shape. A = 1/2(b1 + b2) x h." },
      { term: "Base", def: "One of the two parallel sides of a trapezoid." },
    ],
    [`${BASE}/math/unit-5/5-4-apply-area-concepts/index.html`]: [
      {
        term: "Composite Figure",
        def: "A shape made by combining two or more simple shapes.",
      },
      {
        term: "Area",
        def: "The total space inside a shape, measured in square units.",
      },
    ],
    [`${BASE}/math/unit-5/5-5-volume-rectangular-prisms/index.html`]: [
      {
        term: "Volume",
        def: "The space inside a 3D shape, measured in cubic units.",
      },
      {
        term: "Rectangular Prism",
        def: "A 3D box shape with 6 rectangular faces.",
      },
      { term: "Base", def: "The bottom face of the prism." },
    ],
    [`${BASE}/math/unit-5/study-guide/index.html`]: [
      { term: "Area", def: "The space inside a flat shape." },
      { term: "Volume", def: "The space inside a 3D shape." },
      { term: "Surface Area", def: "Total area of all faces of a 3D shape." },
      { term: "Parallelogram", def: "A shape with 2 pairs of parallel sides." },
      {
        term: "Trapezoid",
        def: "A shape with exactly 1 pair of parallel sides.",
      },
    ],
  };

  let count = 0;
  for (const [filePath, words] of Object.entries(vocabSets)) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`NOT FOUND: ${filePath}`);
        continue;
      }
      let html = fs.readFileSync(filePath, "utf8");
      if (html.includes("VOCAB INTRO SLIDESHOW")) {
        console.log(`SKIP (already done): ${filePath}`);
        continue;
      }
      if (!html.match(/vocab|Vocab|VOCAB/i)) {
        console.log(`NO VOCAB CONTENT: ${filePath}`);
        continue;
      }

      const id = path
        .basename(path.dirname(filePath))
        .replace(/[^a-zA-Z0-9]/g, "");
      const intro = generateVocabIntro(words, id);
      html = html.replace(/(<body[^>]*>)/i, `$1\n${intro}`);
      fs.writeFileSync(filePath, html, "utf8");
      console.log(`OK (${words.length} words): ${filePath}`);
      count++;
    } catch (e) {
      console.error(`ERR: ${filePath}: ${e.message}`);
    }
  }
  return count;
}

// Process ESOL and WIDA files
function processEsolFiles() {
  const vocabSets = {
    [`${BASE}/esol-reading-writing/esolreading/index.html`]: null, // will extract
    [`${BASE}/wida-access/index.html`]: null, // will check
    [`${BASE}/mcap-review/mcapreview/index.html`]: null, // will check
  };

  let count = 0;
  for (const filePath of Object.keys(vocabSets)) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`NOT FOUND: ${filePath}`);
        continue;
      }
      let html = fs.readFileSync(filePath, "utf8");
      if (html.includes("VOCAB INTRO SLIDESHOW")) {
        console.log(`SKIP (already done): ${filePath}`);
        continue;
      }

      // For WIDA and MCAP, check if they have actual vocab sections or just mentions
      const vocabMentions = (html.match(/vocab/gi) || []).length;
      if (vocabMentions < 5) {
        console.log(`SKIP (only ${vocabMentions} mentions): ${filePath}`);
        continue;
      }

      // Try to extract vocab from various patterns
      const words = [];

      // Pattern: Key Vocabulary sections
      const p1 = html.matchAll(
        /<div class="vocab-term">([^<]+)<\/div>\s*<div class="vocab-def">([^<]+)<\/div>/g,
      );
      for (const m of p1) words.push({ term: m[1].trim(), def: m[2].trim() });

      const p2 = html.matchAll(
        /<div class="vocab-card"[^>]*><b>([^<]+)<\/b>\s*([^<]+)<\/div>/g,
      );
      for (const m of p2) words.push({ term: m[1].trim(), def: m[2].trim() });

      const p3 = html.matchAll(
        /<div class="vc-term">([^<]+)<\/div>[\s\S]*?<div class="vc-def">([^<]+)<\/div>/g,
      );
      for (const m of p3) words.push({ term: m[1].trim(), def: m[2].trim() });

      if (words.length === 0) {
        console.log(`NO EXTRACTABLE VOCAB: ${filePath}`);
        continue;
      }

      // Deduplicate
      const seen = new Set();
      const unique = words.filter((w) => {
        const key = w.term.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const id = path
        .basename(path.dirname(filePath))
        .replace(/[^a-zA-Z0-9]/g, "");
      const intro = generateVocabIntro(unique, id);
      html = html.replace(/(<body[^>]*>)/i, `$1\n${intro}`);
      fs.writeFileSync(filePath, html, "utf8");
      console.log(`OK (${unique.length} words): ${filePath}`);
      count++;
    } catch (e) {
      console.error(`ERR: ${filePath}: ${e.message}`);
    }
  }
  return count;
}

// RUN
console.log("\n=== VOCAB INTRO SLIDESHOW INJECTOR ===\n");
let total = 0;
total += processVocabDataFiles();
total += processHtmlVocabCards();
total += processInlineVocabFiles();
total += processEEFiles();
total += processUnit5Files();
total += processRemainingMathFiles();
total += processEsolFiles();
console.log(`\n=== DONE: ${total} files modified ===\n`);
