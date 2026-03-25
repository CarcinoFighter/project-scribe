import * as mammoth from 'mammoth';
import TurndownService from 'turndown';
// @ts-expect-error - turndown-plugin-gfm often lacks official type definitions
import { gfm } from 'turndown-plugin-gfm';

/**
 * Converts a .docx file (as ArrayBuffer) to Markdown string.
 * Optimized for list/bullet point preservation and GFM tables.
 */
export async function convertDocxToMarkdown(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    /**
     * FIX: Mammoth needs an explicit style map to ensure Word's bullet 
     * and numbered list styles are converted to semantic HTML <ul> and <ol> tags.
     */
    const options = {
      styleMap: [
        "p[style-name='List Bullet'] => ul > li:fresh",
        "p[style-name='List Bullet 2'] => ul > li > ul > li:fresh",
        "p[style-name='List Number'] => ol > li:fresh",
        "p[style-name='List Number 2'] => ol > li > ol > li:fresh",
        "p[style-name='Normal List'] => ul > li:fresh"
      ]
    };

    // 1. Convert .docx to HTML using the style map
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer }, options);
    
    // 2. Initialize Turndown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*'
    });
    
    // 3. Enable GFM for tables and task lists
    turndownService.use(gfm);

    /**
     * FIX: Ensure Turndown specifically handles list items correctly 
     * by stripping leading/trailing whitespace that Word often injects.
     */
    turndownService.addRule('listItems', {
      filter: 'li',
      replacement: function (content, node) {
        content = content
          .replace(/^\s+/, '') // Remove leading whitespace
          .replace(/\s+$/, '') // Remove trailing whitespace
          .replace(/\n/gm, '\n    '); // Handle indentation for multi-line list items
        
        const prefix = (node.parentNode as HTMLElement)?.nodeName === 'OL' ? '1. ' : '- ';
        return prefix + content + '\n';
      }
    });
    
    // 4. Convert the HTML to Markdown
    let markdown = turndownService.turndown(html);
    
    // 5. Final cleanup: limit consecutive newlines to 2
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return markdown.trim() || "*(This document appears to be empty)*\n";
  } catch (error) {
    console.error('Error converting .docx to markdown:', error);
    throw new Error('Failed to convert Word document. Please ensure it is a valid .docx file.');
  }
}