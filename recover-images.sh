#!/bin/bash
# Missing Images Recovery Script
# Run from: ~/Documents/Alabs_blog
# Usage: bash recover-images.sh

echo "=== Attempting to recover 51 missing images ==="
echo ""

DEST="public/wp-content/uploads"
SUCCESS=0
FAIL=0

# Function to try downloading with multiple extensions
try_download() {
  local URL="$1"
  local POST="$2"
  
  # Extract the path for local storage
  local REL_PATH=$(echo "$URL" | sed 's|https://www.analytixlabs.co.in/wp-content/uploads/||')
  
  # Try common extensions
  for EXT in ".PM.png" ".AM.png" ".png" ".jpg" ".webp" ".PM.jpg" ".AM.jpg"; do
    local FULL_URL="${URL}${EXT}"
    local LOCAL_PATH="${DEST}/${REL_PATH}${EXT}"
    local DIR=$(dirname "$LOCAL_PATH")
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FULL_URL")
    
    if [ "$HTTP_CODE" = "200" ]; then
      mkdir -p "$DIR"
      curl -s -o "$LOCAL_PATH" "$FULL_URL"
      echo "✅ [$POST] Found: ${EXT} → $LOCAL_PATH"
      SUCCESS=$((SUCCESS + 1))
      return 0
    fi
  done
  
  echo "❌ [$POST] Not found: $URL"
  FAIL=$((FAIL + 1))
  return 1
}

echo "--- Category A: Screenshots without extensions (trying .PM.png, .AM.png, .png, .jpg, .webp) ---"
echo ""

# data-science-market-research-report-2024 (8 images)
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2024/08/Screenshot-2024-08-13-at-4.34.39" "data-science-market-research-report-2024"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2024/08/Screenshot-2024-08-13-at-4.29.47" "data-science-market-research-report-2024"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2024/08/Screenshot-2024-08-13-at-4.37.54" "data-science-market-research-report-2024"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2024/08/Screenshot-2024-08-13-at-4.36.07" "data-science-market-research-report-2024"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2024/08/Screenshot-2024-08-13-at-4.43.34" "data-science-market-research-report-2024"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2024/08/Screenshot-2024-08-13-at-4.39.20" "data-science-market-research-report-2024"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2024/08/Screenshot-2024-08-13-at-4.40.59" "data-science-market-research-report-2024"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2024/08/Screenshot-2024-08-13-at-4.45.19" "data-science-market-research-report-2024"

# agentic-ai-data-science-jobs-report-2025 (19 images)
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.45.15" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.44.10" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.45.54" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.47.50" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-5.36.39" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-5.51.15" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-5.38.26" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-5.57.54" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-5.54.18" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.06.43" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.05.04" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.03.09" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.10.06" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.12.28" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.23.00" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.25.04" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.21.35" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.41.33" "agentic-ai-data-science-jobs-report-2025"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/05/Screenshot-2025-05-06-at-6.36.22" "agentic-ai-data-science-jobs-report-2025"

# exploratory-data-analysis (1 image)
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/11/Screenshot-2025-11-13-at-4.07.52" "exploratory-data-analysis"

# image-search-in-cybersecurity (1 image)
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/03/Screenshot-2025-11-20-at-10.46.26" "image-search-in-cybersecurity"

# power-bi-vs-tableau (5 images)
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/11/Screenshot-2025-11-19-at-12.53.05" "power-bi-vs-tableau"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/11/Screenshot-2025-11-19-at-12.52.09" "power-bi-vs-tableau"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/11/Screenshot-2025-11-19-at-12.56.14" "power-bi-vs-tableau"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/11/Screenshot-2025-11-19-at-12.54.25" "power-bi-vs-tableau"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/11/Screenshot-2025-11-19-at-12.56.51" "power-bi-vs-tableau"

# types-of-business-analytics (6 images)
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/10/Screenshot-2025-10-31-at-12.41.53" "types-of-business-analytics"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/10/Screenshot-2025-10-31-at-12.45.50" "types-of-business-analytics"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/10/Screenshot-2025-10-31-at-1.40.47" "types-of-business-analytics"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/10/Screenshot-2025-10-31-at-12.59.34" "types-of-business-analytics"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/10/Screenshot-2025-10-31-at-4.38.34" "types-of-business-analytics"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/10/Screenshot-2025-10-31-at-4.01.04" "types-of-business-analytics"

# chatgpt-alternatives (1 image)
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2023/03/Screenshot-2025-11-11-at-5.24.02" "chatgpt-alternatives"

# data-scientist-salary (2 images)
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/11/Screenshot-2025-11-06-at-5.20.39" "data-scientist-salary"
try_download "https://www.analytixlabs.co.in/wp-content/uploads/2025/11/Screenshot-2025-11-06-at-5.04.39" "data-scientist-salary"

echo ""
echo "--- Category B: Full-filename 404s (trying direct download) ---"
echo ""

# These have proper filenames — try direct curl
declare -A CAT_B_URLS
CAT_B_URLS=(
  ["cyber-security-in-india"]="https://www.analytixlabs.co.in/wp-content/uploads/2021/12/Challenges-of-cyber-security-in-india-Analytix-devwp.jpg"
  ["big-data-technologies-1"]="https://www.analytixlabs.co.in/wp-content/uploads/2022/04/Top-Big-Data-Technologies-and-techniques-Analytix-devwp.jpg"
  ["big-data-technologies-2"]="https://www.analytixlabs.co.in/wp-content/uploads/2022/04/Where-are-Big-Data-Technologies-Analytix-devwp.jpg"
  ["big-data-technologies-3"]="https://www.analytixlabs.co.in/wp-content/uploads/2022/04/What-are-Big-Data-Technologies-Analytix-devwp.jpg"
  ["ai-python-code-generator"]="https://www.analytixlabs.co.in/wp-content/uploads/2024/12/gitdevwp.png"
)

for KEY in "${!CAT_B_URLS[@]}"; do
  URL="${CAT_B_URLS[$KEY]}"
  REL_PATH=$(echo "$URL" | sed 's|https://www.analytixlabs.co.in/wp-content/uploads/||')
  LOCAL_PATH="${DEST}/${REL_PATH}"
  DIR=$(dirname "$LOCAL_PATH")
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  if [ "$HTTP_CODE" = "200" ]; then
    mkdir -p "$DIR"
    curl -s -o "$LOCAL_PATH" "$URL"
    echo "✅ [$KEY] Downloaded: $LOCAL_PATH"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "❌ [$KEY] Still 404: $URL"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "--- Category C: External dead sites (3 images — cannot recover) ---"
echo "❌ [data-analyst-interview-questions] mk0trumpexcelrq4mcds.kinstacdn.com — domain dead"
echo "❌ [top-data-science-interview-questions] www.inwinstack.com — SSL certificate mismatch"  
echo "❌ [artificial-intelligence-interview-questions] bigdata-madesimple.com — domain dead"
echo ""
echo "=== Summary ==="
echo "Recovered: $SUCCESS"
echo "Still missing: $FAIL + 3 (dead external sites)"
echo ""
echo "For images that couldn't be recovered, the placeholder image will be shown."
echo "To replace them manually, find similar images and save to the expected path in public/wp-content/uploads/"
