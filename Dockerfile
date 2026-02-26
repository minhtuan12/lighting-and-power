# Base image containing Node.js runtime
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files from the host to the container
COPY package.json pnpm-lock.yaml ./

# Install the dependencies listed in package.json
RUN pnpm install --frozen-lockfile

# Copy the application files from the host to the container
COPY . .

# Build the Next.js application
RUN pnpm run build

# Expose the port Next.js runs on
EXPOSE 4000

# Define the command to run the Next.js app when the container starts
CMD ["pnpm", "run", "start"]
