# Menggunakan image Node.js sebagai base image
FROM node:18

# Set working directory di dalam container
WORKDIR /home/node/app

# Copy package.json dan package-lock.json
COPY ./backend/package*.json .

# Intall Process Manager PM2
RUN npm install pm2 -g

# Install dependencies
RUN npm install

# Copy seluruh kode aplikasi ke dalam container
COPY ./backend .

# Expose port yang digunakan oleh aplikasi
EXPOSE 3000

# Jalankan aplikasi saat container di-start
CMD ["npm", "start"]