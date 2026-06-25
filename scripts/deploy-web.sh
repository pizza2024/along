#!/bin/bash
set -euo pipefail

ENV="${1:-prod}"

# Load env files in order: .env -> .env.{ENV} -> .env.{ENV}.local
set -a
if [[ -f .env ]]; then source .env; fi
if [[ -f .env.${ENV} ]]; then source .env.${ENV}; fi
if [[ -f .env.${ENV}.local ]]; then source .env.${ENV}.local; fi
set +a

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required env vars
required_vars=(
  DEPLOY_WEB_HOST
  DEPLOY_WEB_USER
  DEPLOY_WEB_PATH
  DEPLOY_WEB_KEY
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo -e "${RED}Error: Missing required env var: $var${NC}"
    exit 1
  fi
done

if [[ ! -f "$DEPLOY_WEB_KEY" ]]; then
  echo -e "${RED}Error: SSH key not found: $DEPLOY_WEB_KEY${NC}"
  exit 1
fi

chmod 600 "$DEPLOY_WEB_KEY"

echo -e "${YELLOW}🚀 Building web export...${NC}"
npx expo export --platform web

# Inject cache-busting meta tags into index.html to prevent stale HTML caching
echo -e "${YELLOW}📝 Injecting cache-control meta tags...${NC}"
if [[ -f ./dist/index.html ]]; then
  sed -i.bak \
    's|<meta charSet="utf-8"/>|<meta charSet="utf-8"/>\
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>\
<meta http-equiv="Pragma" content="no-cache"/>\
<meta http-equiv="Expires" content="0"/>|' \
    ./dist/index.html
  rm -f ./dist/index.html.bak
fi

echo -e "${YELLOW}📦 Uploading to server...${NC}"
scp -i "$DEPLOY_WEB_KEY" -o StrictHostKeyChecking=no -r ./dist "${DEPLOY_WEB_USER}@${DEPLOY_WEB_HOST}:/tmp/along-dist"

echo -e "${YELLOW}🔄 Deploying on server...${NC}"
ssh -i "$DEPLOY_WEB_KEY" -o StrictHostKeyChecking=no "${DEPLOY_WEB_USER}@${DEPLOY_WEB_HOST}" << SSH_EOF
  set -e
  # Stop any running docker containers (optional, based on env)
  if command -v docker &> /dev/null; then
    docker ps -q | xargs -r docker stop 2>/dev/null || true
  fi

  # Install nginx if not present
  if ! command -v nginx &> /dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq nginx
  fi

  # Ensure nginx is running
  sudo systemctl start nginx || true

  # Move files to web root
  sudo rm -rf "${DEPLOY_WEB_PATH}"
  sudo mv /tmp/along-dist "${DEPLOY_WEB_PATH}"
  sudo chown -R www-data:www-data "${DEPLOY_WEB_PATH}"

  # Setup nginx site config if not present or update
  NGINX_CONF="/etc/nginx/sites-available/along"
  if [[ ! -f "\$NGINX_CONF" ]]; then
    sudo tee "\$NGINX_CONF" > /dev/null << 'EOF'
server {
    listen 80;
    server_name ${DEPLOY_WEB_DOMAIN:-_};

    root ${DEPLOY_WEB_PATH};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF
    sudo ln -sf "\$NGINX_CONF" /etc/nginx/sites-enabled/along
    sudo rm -f /etc/nginx/sites-enabled/default
  fi

  sudo nginx -t
  sudo systemctl restart nginx
  sudo systemctl enable nginx
SSH_EOF

echo -e "${GREEN}✅ Deployed to https://${DEPLOY_WEB_DOMAIN:-$DEPLOY_WEB_HOST}${NC}"
