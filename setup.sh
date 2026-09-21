#!/bin/bash

# TODO:
# 
# 
# 
# 
# 

set -e

START_DATE=$(date)
echo "Started at $START_DATE"
export RANDOM_STRING=$(head /dev/urandom | tr -dc a-z0-9 | head -c4)
echo "RANDOM_STRING is: $RANDOM_STRING"

echo "Loading environment variables from .env..."
if [ -f ./.env ]; then
   source .env
   echo "Loading environment variables from .env... DONE"
   echo "ACR_NAME is: $ACR_NAME"
else
   echo "File .env does not exist."
   exit
fi

echo "Checking if variable SUBSCRIPTION has been set in .env..."
if [ $SUBSCRIPTION ]; then
   source .env
   echo "Checking if variable SUBSCRIPTION has been set in .env... DONE"
   echo "SUBSCRIPTION ID is: $SUBSCRIPTION"
else
   echo "Variable SUBSCRIPTION in .env has not been set"
   exit
fi

# az login
# Optional: az login --use-device-code
echo "Setting subscription to $SUBSCRIPTION"
az account set --subscription $SUBSCRIPTION

echo "Registering required Azure provider: Microsoft.ContainerRegistry"
az provider register --namespace Microsoft.ContainerRegistry

echo "Registering required Azure provider: Microsoft.ContainerService"
az provider register --namespace Microsoft.ContainerService

echo "Registering required Azure provider: Microsoft.Sql"
az provider register --namespace Microsoft.Sql


az extension add --name scheduled-query
az extension add --name application-insights


echo "ACR_NAME is: $ACR_NAME"


# Sleep 20 seconds
sleep 60





# Create the resource group
az group create \
  --name "$AKS_RESOURCE_GROUP" \
  --location "$LOCATION"

# Create the Azure Container Registry
az acr create \
  --resource-group "$AKS_RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --location "$LOCATION" \
  --sku Standard

# Create a public AKS cluster
az aks create \
  --resource-group "$AKS_RESOURCE_GROUP" \
  --name "$AKS_CLUSTER_NAME" \
  --location "$LOCATION" \
  --node-count 2 \
  --node-vm-size Standard_d2s_v6 \
  --network-plugin azure \
  --network-plugin-mode overlay \
  --network-dataplane cilium \
  --pod-cidr "$POD_CIDR" \
  --enable-managed-identity \
  --attach-acr "$ACR_NAME" \
  --enable-gateway-api \
  --generate-ssh-keys

# --ssh-access disabled

echo "ACR_NAME is: $ACR_NAME"
sleep 10

# Fetch credentials
echo "Fetching AKS cluster credentials..."

az aks get-credentials \
  --resource-group $AKS_RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --overwrite-existing
  
echo "ACR_NAME is: $ACR_NAME"






#2_Azure SRE Agent Preparation


az group create \
  --name "$AGENT_RESOURCE_GROUP" \
  --location "$AGENT_LOCATION"


# --- Log Analytics workspace ----------------------------------------------
az monitor log-analytics workspace create \
  --resource-group "$AGENT_RESOURCE_GROUP" \
  --workspace-name "$AGENT_LAW_NAME" \
  --location "$AGENT_LOCATION" \
  --sku PerGB2018 \
  --retention-time 30

AGENT_LAW_ID="$(az monitor log-analytics workspace show \
  --resource-group "$AGENT_RESOURCE_GROUP" \
  --workspace-name "$AGENT_LAW_NAME" \
  --query id -o tsv)"

# --- Application Insights (workspace-based) --------------------------------
az monitor app-insights component create \
  --resource-group "$AGENT_RESOURCE_GROUP" \
  --app "$AGENT_APPINSIGHTS_NAME" \
  --location "$AGENT_LOCATION" \
  --kind web \
  --application-type web \
  --workspace "$AGENT_LAW_ID"



echo "ACR_NAME is: $ACR_NAME"


#3_ Observability


# Ensure required extensions are available non-interactively.
# az config set extension.use_dynamic_install=yes_without_prompt >/dev/null

# --- Resource group --------------------------------------------------------
az group create \
  --name "$OBS_RESOURCE_GROUP" \
  --location "$LOCATION"

# --- Log Analytics workspace ----------------------------------------------
az monitor log-analytics workspace create \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --workspace-name "$OBS_LAW_NAME" \
  --location "$LOCATION" \
  --sku PerGB2018 \
  --retention-time 30

OBS_LAW_ID="$(az monitor log-analytics workspace show \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --workspace-name "$OBS_LAW_NAME" \
  --query id -o tsv)"

echo "OBS_LAW_ID: $OBS_LAW_ID"

# --- Application Insights (workspace-based) --------------------------------
az monitor app-insights component create \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --app "$OBS_APPINSIGHTS_NAME" \
  --location "$LOCATION" \
  --kind web \
  --application-type web \
  --workspace "$OBS_LAW_ID"

OBS_APPINSIGHTS_ID="$(az monitor app-insights component show \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --app "$OBS_APPINSIGHTS_NAME" \
  --query id -o tsv)"

echo "OBS_APPINSIGHTS_ID: $OBS_APPINSIGHTS_ID"

# The APPINSIGHTS_CONNECTION_STRING is required for configuring the application to send telemetry data to Application Insights.
export APPINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --app "$OBS_APPINSIGHTS_NAME" \
  --query connectionString -o tsv)

echo "ACR_NAME is: $ACR_NAME"

# --- Metric alert: Error2 --------------------------------------------------
# Fires when the App Insights exceptions count is greater than 0.
#az monitor metrics alert create \
#  --resource-group "$OBS_RESOURCE_GROUP" \
#  --name "$OBS_ALERT_PAYMENT_ERROR" \
#  --scopes "$OBS_APPINSIGHTS_ID" \
#  --severity 1 \
#  --evaluation-frequency 1m \
#  --window-size 1m \
#  --condition "count exceptions/count > 0" \
#  --description "Connectivity or processing error in payment system."

# --- Log alert: Database Connectivity Error --------------------------------
# Scheduled query (log) alert on a specific ODBC/SQL connectivity exception.
read -r -d '' DB_CONN_QUERY <<'KQL' || true
exceptions 
| where outerMessage contains "PAY-MSUTY3ZE-1OFQ"
KQL

az monitor scheduled-query create \
  --resource-group "$OBS_RESOURCE_GROUP" \
  --name "$OBS_LOG_ALERT_NAME" \
  --scopes "$OBS_APPINSIGHTS_ID" \
  --severity 0 \
  --evaluation-frequency 5m \
  --window-size 5m \
  --condition "count 'DbConnErrors' >= 1" \
  --condition-query DbConnErrors="$DB_CONN_QUERY" \
  --location "$LOCATION" \
  --description "Fires when payment system is unreachable." \
  --auto-mitigate false

echo "ACR_NAME is: $ACR_NAME"


#4_ Database

# Create the resource group (safe to re-run)
az group create \
  --name "$DB_RESOURCE_GROUP" \
  --location "$LOCATION"

# Create the Azure SQL logical server
az sql server create \
  --name "$DB_SERVER_NAME" \
  --resource-group "$DB_RESOURCE_GROUP" \
  --location "$LOCATION" \
  --admin-user "$DB_USER" \
  --admin-password "$DB_PASSWORD"

# Allow other Azure services (e.g. AKS) to reach the server
az sql server firewall-rule create \
  --resource-group "$DB_RESOURCE_GROUP" \
  --server "$DB_SERVER_NAME" \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

# Create the database
az sql db create \
  --resource-group "$DB_RESOURCE_GROUP" \
  --server "$DB_SERVER_NAME" \
  --name "$DB_NAME" \
  --service-objective S0

echo "SQL server FQDN: ${DB_SERVER_NAME}.database.windows.net"
echo "ACR_NAME is: $ACR_NAME"

python3 -m venv .venv
echo "ACR_NAME is: $ACR_NAME"
sleep 2
. .venv/bin/activate
echo "ACR_NAME is: $ACR_NAME"
pip install pyodbc
echo "ACR_NAME is: $ACR_NAME"
python3 deploy/import_sql.py deploy/sql/*.sql
echo "ACR_NAME is: $ACR_NAME"
deactivate
echo "ACR_NAME is: $ACR_NAME"


##################################

TOKEN=$(az acr login --name $ACR_NAME --expose-token --output tsv --query accessToken)
docker login $ACR_NAME.azurecr.io --username "00000000-0000-0000-0000-000000000000" --password-stdin <<< $TOKEN

# az acr login --name "$ACR_NAME"

echo "ACR_NAME is: $ACR_NAME"

# Build and push backend-catalog image 
echo "Building and pushing 'battlebot-backend-catalog' Docker images..."
az acr build --registry $ACR_NAME --image $ACR_NAME.azurecr.io/battlebot-backend-catalog:0.0.1 --file backend-catalog/Dockerfile backend-catalog/
# docker build -t $ACR_NAME.azurecr.io/battlebot-backend-catalog:0.0.1 ./backend-catalog
# docker push $ACR_NAME.azurecr.io/battlebot-backend-catalog:0.0.1
echo "Finished building and pushing 'battlebot-backend-catalog' Docker images."

# Build and push backend-payment image 
echo "Building and pushing 'battlebot-backend-payment' Docker images..."
az acr build --registry $ACR_NAME --image $ACR_NAME.azurecr.io/battlebot-backend-payment:0.0.1 --file backend-payment/Dockerfile backend-payment/
# docker build -t $ACR_NAME.azurecr.io/battlebot-backend-payment:0.0.1 ./backend-payment
# docker push $ACR_NAME.azurecr.io/battlebot-backend-payment:0.0.1
echo "Finished building and pushing 'battlebot-backend-payment' Docker images."

# Build and push frontend image 
echo "Building and pushing 'frontend' Docker images..."
az acr build --registry $ACR_NAME --image $ACR_NAME.azurecr.io/battlebot-frontend:0.0.1 --file frontend/Dockerfile frontend/
# docker build -t $ACR_NAME.azurecr.io/battlebot-frontend:0.0.1 ./frontend
# docker push $ACR_NAME.azurecr.io/battlebot-frontend:0.0.1
echo "Finished building and pushing 'frontend' Docker images."  




contents=$(ls kubernetes.example)
for filename in $contents
do 
  cat kubernetes.example/$filename | envsubst > kubernetes/$filename
done



kubectl create ns battlebot-backend
kubectl create ns battlebot-frontend
sleep 2
kubectl apply -f kubernetes/

#5_ SRE Agent

sleep 30

echo "Started at:  $START_DATE"
echo "Finished at: $(date)"

URL="http://$(kubectl -n battlebot-frontend get service/public-svc -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"

echo "--------------------------------------------------------"
echo "-                                                      -"
echo "-               URL: $URL               -"
echo "-                                                      -"
echo "--------------------------------------------------------"



# AGENT_APPINSIGHTS_ID="$(az monitor app-insights component show \
#  --resource-group "$AGENT_RESOURCE_GROUP" \
#  --app "$AGENT_APPINSIGHTS_NAME" \
#  --query id -o tsv)"









## Azure SRE Agent Export and Deployment

#./bin/export-agent.sh --set agentName=clone2 -o export_2026_08_02/ -s c202c407-5be9-48fe-b16b-31049a9ce375 -g talk-sre-battlebot-agent-rg -n clone


#./bin/deploy.sh import_2026_05_25/ --what-if
#./bin/deploy.sh import_2026_05_25/


