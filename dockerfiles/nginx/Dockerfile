FROM nginx:latest

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/ssl/localcerts

# inline certificate generation
RUN echo '#!/bin/bash\n\
if [ ! -f "/etc/ssl/localcerts/localhost.pem" ] || [ ! -f "/etc/ssl/localcerts/localhost-key.pem" ]; then\n\
    openssl genrsa -out /etc/ssl/localcerts/localhost-key.pem 2048\n\
    openssl req -new -key /etc/ssl/localcerts/localhost-key.pem -out /etc/ssl/localcerts/localhost.csr -subj "/C=CN/ST=Beijing/L=Beijing/O=DLP3D/OU=IT/CN=localhost"\n\
    openssl x509 -req -days 365 -in /etc/ssl/localcerts/localhost.csr -signkey /etc/ssl/localcerts/localhost-key.pem -out /etc/ssl/localcerts/localhost.pem\n\
    rm /etc/ssl/localcerts/localhost.csr\n\
    echo "SSL certificate generated"\n\
else\n\
    echo "SSL certificate already exists"\n\
fi\n\
exec nginx -g "daemon off;"' > /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
