# GCP Cloud Run

TODO: update docs

```bash
export PROJECT_ID="eklhad-web"

gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud auth configure-docker

gcloud projects add-iam-policy-binding eklhad-web \
    --member="user:neil@dahlke.io" \
    --role="roles/artifactregistry.writer"

# Tag the image
docker tag eklhad/eklhad-web gcr.io/$PROJECT_ID/eklhad-web

# Push the image
docker push gcr.io/$PROJECT_ID/eklhad-web

gcloud run deploy eklhad-web \
    --image gcr.io/$PROJECT_ID/eklhad-web \
    --region us-central1 \
    --service-account eklhad-web-circleci@eklhad-web.iam.gserviceaccount.com \
    --allow-unauthenticated \
    --port=3554

gcloud run deploy eklhad-web \
    --image gcr.io/$PROJECT_ID/eklhad-web \
    --region us-central1 \
    --service-account eklhad-web-circleci@eklhad-web.iam.gserviceaccount.com \
    --allow-unauthenticated \
    --port=3554
```

# AWS Lambda

```bash
TODO
```