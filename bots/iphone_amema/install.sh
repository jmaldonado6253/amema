#!/bin/bash

if [ ! -d "badpng" ]; then
  mkdir badpng && cd badpng
  curl -O https://bitbucket.org/runhello/badpng/get/tip.zip
  unzip tip.zip && rm tip.zip
  cd runhello* && mv * .. && cd .. && rm -r runhello*
  make all
else
  echo "badpng exists"
fi
