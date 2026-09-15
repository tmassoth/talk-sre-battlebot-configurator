# Prepare Kubernetes Manifests
This is the folder in which all Kubernetes manifests will be stored once the following two activities have been completed:
1. The .env file has been updated 
2. The following script has been executed at root folder level (battlebot-configurator):

```
contents=$(ls kubernetes.example)
for filename in $contents
do 
  cat kubernetes.example/$filename | envsubst > kubernetes/$filename
done
```
