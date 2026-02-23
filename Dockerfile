FROM node:22.13.0

WORKDIR /app
COPY --chown=node:node . .

USER node

#RUN npm i yarn
#RUN yarn global add @angular/cli@latest
RUN rm -rf node_modules
RUN yarn && yarn add moment && yarn add vis-util && npm run build --prod --build-optimizer
#RUN ng build --prod --outputPath=dist/www/en --baseHref=/ --i18nLocale=en --verbose=true
RUN npm run compress:brotli
#RUN npm run compress:gzip

WORKDIR /app/dist
COPY --chown=node:node assets/SPV/client-assets/dist www/en/assets
RUN npm install --production
EXPOSE 3004

CMD [ "npm", "run", "serve:prod" ]
