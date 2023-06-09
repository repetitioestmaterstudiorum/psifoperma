FROM node:14

# Set the working directory
WORKDIR /app

# Create a non-root user
RUN groupadd -r meteor && useradd -r -m -s /bin/bash -g meteor meteor

COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Change the ownership of the /app directory to the meteor user
RUN chown -R meteor:meteor /app

RUN curl https://install.meteor.com/ | sh

# Create the /app-built directory and change its ownership to the meteor user
RUN mkdir /app-built && chown meteor:meteor /app-built

# Switch to the meteor user
USER meteor

RUN meteor build --directory /app-built --server-only

# Switch back to the root user
USER root

# Change the working directory to the built app
WORKDIR /app-built/bundle

# Install production dependencies for the server
RUN (cd programs/server && npm install --production)

EXPOSE 8080

CMD ["node", "main.js"]
