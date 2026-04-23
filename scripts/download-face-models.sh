mkdir -p public/models

# Download face-api.js models from justadudewhohacks repository
curl -L -o public/models/tiny_face_detector_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/model_weights/tiny_face_detector/tiny_face_detector_model-weights_manifest.json

curl -L -o public/models/tiny_face_detector_shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/model_weights/tiny_face_detector/shard1

curl -L -o public/models/face_landmark_68_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/model_weights/face_landmark_68/face_landmark_68_model-weights_manifest.json

curl -L -o public/models/face_landmark_68_shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/model_weights/face_landmark_68/shard1

curl -L -o public/models/face_landmark_68_shard2 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/model_weights/face_landmark_68/shard2

curl -L -o public/models/face_recognition_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/model_weights/face_recognition/face_recognition_model-weights_manifest.json

curl -L -o public/models/face_recognition_shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/model_weights/face_recognition/shard1

echo "Models downloaded!"