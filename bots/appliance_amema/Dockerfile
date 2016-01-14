FROM visionai/clouddream
RUN apt-get install -y graphicsmagick
RUN cd /opt && git clone https://github.com/kesara/deepdreamer.git
WORKDIR /opt
ADD . /opt
RUN npm install
