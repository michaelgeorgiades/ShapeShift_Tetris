#Use a lightweight Nginx image
FROM nginx:stable-alpine

#Copy your Shape Shift files into the container
COPY . /usr/share/nginx/html

#Expose port 80 for HTTP traffic
EXPOSE 80

#Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]