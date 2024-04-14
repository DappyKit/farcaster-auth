export const MAX_FRAME_PAGE_SIZE_BYTES = 2 * 1024 * 1024

/**
 * Validate frame URL by checking the frame owner tag
 * @param url URL
 * @param fid Frame owner ID
 */
export async function validateFrameUrl(url: string, fid: number): Promise<void> {
  const expectedTag = `<meta property="frame:owner" content="${fid}"/>`
  const pageText = await (await fetch(url)).text()

  if (pageText.length > MAX_FRAME_PAGE_SIZE_BYTES) {
    throw new Error(`The frame page is too large. The maximum allowed size is ${MAX_FRAME_PAGE_SIZE_BYTES} bytes.`)
  }

  if (!pageText.includes(expectedTag)) {
    throw new Error('Cannot find the frame owner tag on the page. Please add the tag to the page.')
  }
}
