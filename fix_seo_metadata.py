import sys
content = open('src/app/layout.tsx').read()

# Fix og:image dimensions and description
content = content.replace(
    "width: 640,\n        height: 640,",
    "width: 1200,\n        height: 630,"
)

# Update robots.txt
robots = open('public/robots.txt').read()
robots = robots.replace("Disallow: /dashboard/", "Allow: /dashboard/\nAllow: /leaderboard/\nAllow: /explorer/\nAllow: /claim/")
open('public/robots.txt', 'w').write(robots)

open('src/app/layout.tsx', 'w').write(content)
