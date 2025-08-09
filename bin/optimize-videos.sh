#!/bin/bash

# Video Optimization Script for sermanet.github.io
# This script converts MP4 videos to WebM format for better compression
# and generates poster images for improved loading experience

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is required but not installed."
    echo "Please install ffmpeg: sudo apt-get install ffmpeg (Ubuntu/Debian) or brew install ffmpeg (macOS)"
    exit 1
fi

# Configuration
ASSETS_DIR="../assets"
QUALITY="23"  # CRF value for WebM (lower = better quality, larger file)
AUDIO_CODEC="none"  # No audio for web videos
THREADS="4"  # Number of threads for encoding

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 Video Optimization Tool for sermanet.github.io${NC}"
echo "=========================================="

# Function to convert MP4 to WebM
convert_to_webm() {
    local input_file="$1"
    local output_file="${input_file%.*}.webm"
    
    if [[ -f "$output_file" ]]; then
        echo -e "${YELLOW}⚠️  WebM already exists: $output_file${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🔄 Converting: $(basename "$input_file")${NC}"
    
    # Convert with optimal settings for web
    ffmpeg -i "$input_file" \
        -c:v libvpx-vp9 \
        -crf "$QUALITY" \
        -b:v 0 \
        -threads "$THREADS" \
        -an \
        -f webm \
        -y \
        "$output_file" \
        -loglevel quiet -stats
    
    if [[ $? -eq 0 ]]; then
        # Calculate size reduction
        original_size=$(du -h "$input_file" | cut -f1)
        new_size=$(du -h "$output_file" | cut -f1)
        echo -e "${GREEN}✅ Converted: $original_size → $new_size${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to convert: $input_file${NC}"
        return 1
    fi
}

# Function to generate poster image
generate_poster() {
    local video_file="$1"
    local poster_file="${video_file%.*}_poster.jpg"
    
    if [[ -f "$poster_file" ]]; then
        echo -e "${YELLOW}⚠️  Poster already exists: $poster_file${NC}"
        return 0
    fi
    
    echo -e "${BLUE}📸 Generating poster: $(basename "$poster_file")${NC}"
    
    # Extract frame at 1 second or 10% of video duration
    ffmpeg -i "$video_file" \
        -ss 1 \
        -vframes 1 \
        -q:v 3 \
        -y \
        "$poster_file" \
        -loglevel quiet
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Generated poster: $(basename "$poster_file")${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to generate poster: $video_file${NC}"
        return 1
    fi
}

# Function to analyze video
analyze_video() {
    local video_file="$1"
    echo -e "${BLUE}📊 Analyzing: $(basename "$video_file")${NC}"
    
    # Get video info
    local duration=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$video_file" 2>/dev/null | cut -d. -f1)
    local size=$(du -h "$video_file" | cut -f1)
    local resolution=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$video_file" 2>/dev/null)
    
    echo "   Duration: ${duration}s, Size: $size, Resolution: $resolution"
}

# Main processing function
process_videos() {
    local dir="$1"
    local converted=0
    local failed=0
    
    echo -e "${YELLOW}🔍 Scanning directory: $dir${NC}"
    
    # Find all MP4 files
    while IFS= read -r -d '' file; do
        analyze_video "$file"
        
        # Convert to WebM
        if convert_to_webm "$file"; then
            ((converted++))
        else
            ((failed++))
        fi
        
        # Generate poster
        generate_poster "$file"
        
        echo ""
        
    done < <(find "$dir" -name "*.mp4" -type f -print0)
    
    echo -e "${GREEN}✅ Processing complete!${NC}"
    echo "   Converted: $converted videos"
    if [[ $failed -gt 0 ]]; then
        echo -e "${RED}   Failed: $failed videos${NC}"
    fi
}

# Function to show size comparison
show_size_comparison() {
    echo -e "${BLUE}📈 Size Comparison Report${NC}"
    echo "========================="
    
    local total_mp4_size=0
    local total_webm_size=0
    
    while IFS= read -r -d '' mp4_file; do
        local webm_file="${mp4_file%.*}.webm"
        
        if [[ -f "$webm_file" ]]; then
            local mp4_size=$(du -b "$mp4_file" | cut -f1)
            local webm_size=$(du -b "$webm_file" | cut -f1)
            local reduction=$(( (mp4_size - webm_size) * 100 / mp4_size ))
            
            echo "$(basename "$mp4_file"): $(du -h "$mp4_file" | cut -f1) → $(du -h "$webm_file" | cut -f1) (-${reduction}%)"
            
            total_mp4_size=$((total_mp4_size + mp4_size))
            total_webm_size=$((total_webm_size + webm_size))
        fi
    done < <(find "$ASSETS_DIR" -name "*.mp4" -type f -print0)
    
    if [[ $total_mp4_size -gt 0 ]]; then
        local total_reduction=$(( (total_mp4_size - total_webm_size) * 100 / total_mp4_size ))
        echo ""
        echo -e "${GREEN}📊 Total savings: $total_reduction% reduction${NC}"
        echo "Original: $(numfmt --to=iec $total_mp4_size)"
        echo "Optimized: $(numfmt --to=iec $total_webm_size)"
        echo "Saved: $(numfmt --to=iec $((total_mp4_size - total_webm_size)))"
    fi
}

# Main script logic
case "$1" in
    "convert")
        if [[ -d "$ASSETS_DIR" ]]; then
            process_videos "$ASSETS_DIR"
        else
            echo -e "${RED}❌ Assets directory not found: $ASSETS_DIR${NC}"
            exit 1
        fi
        ;;
    "report")
        show_size_comparison
        ;;
    "clean")
        echo -e "${YELLOW}🧹 Cleaning up generated files...${NC}"
        find "$ASSETS_DIR" -name "*.webm" -o -name "*_poster.jpg" | while read file; do
            echo "Removing: $file"
            rm "$file"
        done
        echo -e "${GREEN}✅ Cleanup complete!${NC}"
        ;;
    *)
        echo "Usage: $0 {convert|report|clean}"
        echo ""
        echo "Commands:"
        echo "  convert  - Convert all MP4 files to WebM format and generate posters"
        echo "  report   - Show size comparison between MP4 and WebM files"
        echo "  clean    - Remove all generated WebM files and posters"
        echo ""
        echo "Example:"
        echo "  $0 convert   # Convert all videos"
        echo "  $0 report    # Show optimization results"
        exit 1
        ;;
esac
