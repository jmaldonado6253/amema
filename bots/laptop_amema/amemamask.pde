PImage source;       // Source image
PImage destination;  // Destination image

int linearize(int x, int y)
{
  x = constrain(x, 0, width - 1);
  y = constrain(y, 0, height - 1);
 
  return x + y * width;
}

float g_time;

void setup() {
  size(400, 400);
  source = loadImage("input.jpg");  
  // The destination image is created as a blank image the same size as the source.
  destination = createImage(source.width, source.height, RGB);
    g_time = 0.0;
}

void draw() {  
  // g_time += 0.1;
   noiseDetail(2,1);
  float threshold = 100;
  float threshold2 = 250;
   //  g_time += 0.1;
  // We are going to look at both image's pixels
  source.loadPixels();
  destination.loadPixels();
  
  for (int x = 0; x < source.width; x++) {
    for (int y = 0; y < source.height; y++ ) {
   
     float noiseval = noise(g_time / 1.0, float(x) / 100.0, float(y) / 100.0);
     
      int loc = x + y*source.width;
      // Test the brightness against the threshold
      if (brightness(source.pixels[loc]) > threshold2*noiseval) {
        destination.pixels[loc]  = color(0);  // White
      }   else if ((brightness(source.pixels[loc]) < (threshold2*noiseval)) && ((brightness(source.pixels[loc])) > threshold*noiseval)) {
        destination.pixels[loc]  = source.pixels[loc];    // middle
      }
      else {
        destination.pixels[loc]  = color(255);    // Black
      }
    }
  }

  // We changed the pixels in destination
  destination.updatePixels();
  // Display the destination
  image(destination,0,0);
  
  
  
  
   save("output.jpg");
}