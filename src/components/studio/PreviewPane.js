"use client";

export default function PreviewPane({ postTitle, postBody, excerpt, category, readTime, featuredImage, authorObj }) {
  return (
    <div className="preview-view">
      <div className="preview-sections">
        {/* Home page Preview */}
        <div>
          <div className="preview-lbl">Home page Preview</div>
          <div className="preview-card-big">
            {featuredImage && (
              <img src={featuredImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-lg)", opacity: 0.35 }} />
            )}
            <div style={{ position: "relative", zIndex: 1 }}>
              <span className="preview-card-feat-tag">FEATURED ANALYSIS</span>
              <div className="preview-card-title">{postTitle || "Your Post Title Here"}</div>
              <div className="preview-card-meta">
                <span>{readTime || 0} min read</span>
                <span>{category}</span>
                <span>Updated {new Date().toLocaleString("en", { month: "short", year: "numeric" })}</span>
              </div>
              <div className="preview-card-actions">
                <button className="pca-btn pca-read">Read More</button>
                <button className="pca-btn pca-save">Save Article</button>
              </div>
            </div>
          </div>
        </div>

        {/* Card Preview */}
        <div>
          <div className="preview-lbl">Card Preview</div>
          <div className="preview-card-sm">
            {featuredImage ? <img src={featuredImage} alt="" className="pcm-img" /> : <div className="pcm-img-ph" />}
            <div className="pcm-body">
              <div className="pcm-cat">Featured Analysis</div>
              <div className="pcm-title">{postTitle || "Untitled Article"}</div>
              <div className="pcm-desc">{excerpt || "Your article excerpt will appear here…"}</div>
              <div className="pcm-author">
                <div className="pcm-av">{authorObj.initials}</div>
                <span className="pcm-name">{authorObj.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)" }}>{readTime || 0} min read</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article body preview */}
      <div style={{ background: "var(--bg)", borderRadius: "var(--radius-lg)", padding: "24px 32px", marginTop: 4 }}>
        <div className="tiptap-prose" dangerouslySetInnerHTML={{ __html: postBody || "<p style='color:#9ca3af'>Nothing to preview yet.</p>" }} />
      </div>

      {/* AI Recommended */}
      <div className="ai-recs" style={{ marginTop: 20 }}>
        <div className="ai-recs-lbl">AI Recommended</div>
        <div className="ai-rec-card">
          <div className="ai-rec-ph" />
          <div>
            <div className="ai-rec-title">{postTitle || "Your Post Title"}</div>
            <div className="ai-rec-rt">{readTime || 0} min read</div>
          </div>
        </div>
      </div>
    </div>
  );
}
