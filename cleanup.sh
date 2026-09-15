set -e

echo "This script will delete all the resource groups associated with the demo. This action cannot be undone."
echo "To cancel this operation, press Ctrl+C within the next 5 seconds."
sleep 5
echo "Proceeding with deletion..."

source .env

az group delete \
  --name "$AKS_RESOURCE_GROUP" \
  --yes \
  --no-wait

az group delete \
  --name "$AGENT_RESOURCE_GROUP" \
  --yes \
  --no-wait

az group delete \
  --name "$OBS_RESOURCE_GROUP" \
  --yes \
  --no-wait

az group delete \
  --name "$DB_RESOURCE_GROUP" \
  --yes \
  --no-wait

echo "Deleting of resource groups on-going in background..."

rm -rf .venv
# rm .env
rm kubernetes/configmap.yaml
rm kubernetes/deployment.yaml
rm kubernetes/gateway-api.yaml
rm kubernetes/load-balancer.yaml
rm kubernetes/namespace.yaml
rm kubernetes/secret.yaml
rm kubernetes/service.yaml



