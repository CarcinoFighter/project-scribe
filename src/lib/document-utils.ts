import * as mammoth from 'mammoth';
import TurndownService from 'turndown';

/**
 * Converts a .docx file (as ArrayBuffer) to Markdown string.
 * Uses mammoth to convert to HTML first, then Turndown to convert HTML to Markdown.
 */
export async function convertDocxToMarkdown(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Convert .docx to HTML
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
    
    // Convert HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    });
    
    // Add gfm plugin if needed, but let's start with basic turndown
    const markdown = turndownService.turndown(html);
    
    return markdown;
  } catch (error) {
    console.error('Error converting .docx to markdown:', error);
    throw new Error('Failed to convert Word document. Please ensure it is a valid .docx file.');
  }
}
