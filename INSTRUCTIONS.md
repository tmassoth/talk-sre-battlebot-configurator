# BattleBotForge — Azure SRE Agent Workshop

Hands-on workshop for the **BattleBotForge Configurator** demo. You will deploy the
app to Azure Kubernetes Service (AKS), connect an **Azure SRE Agent**, teach it to
manage your resources, build a Kubernetes-focused sub-agent, and finally wire up an
automated incident-response plan that reacts to a real Azure Monitor alert.

> These instructions do **not** change any application code. You only run the
> provided scripts, edit Kubernetes manifests, and configure the SRE Agent in the
> Azure portal.

---

## Prerequisites

Before you start, make sure the following tools are installed and you are signed in
to Azure with sufficient rights if you want to prepare everything from your local machine.
If you make use of Azure Cloud Shell, you do not need any of the tools prerequisites!

| Tool | Check | Install |
| --- | --- | --- |
| Azure CLI 2.60+ | `az version` | <https://learn.microsoft.com/cli/azure/install-azure-cli> |
| kubectl | `kubectl version --client` | `az aks install-cli` |
| Docker | `docker version` | <https://docs.docker.com/get-docker/> |
| Python 3.10+ | `python3 --version` | <https://python.org> |
| python3-venv |  | apt install python3-venv |
| python-is-python3 |  | apt install python-is-python3 |


For this workshop there are two options:
1.) Bring your own Azure subscription - requirements:

- An active **Azure subscription**.
- **Owner** role on the subscription (needed later for RBAC role assignments made
  by the SRE Agent).

2.) Use the Subscription Sponsorship - requirements:
- sdfsdf 
- sdfsdf
 


- The SRE Agent is available in multiple Azure regions. This demo defaults to `swedencentral`. Some alternative regions are `francecentral`, `uksouth` and `spaincentral`.



Sign in (only required if NOT running in Azure Cloud Shell):

```bash
az login
# If you are on a headless/remote machine:
# az login --use-device-code
```

---

## Step 1 — Deploy the app with `setup.sh`

`setup.sh` provisions everything for the demo in one go: a resource group, Azure
Container Registry (ACR), an AKS cluster, an Azure SQL database (seeded with the
catalog data), Log Analytics + Application Insights, the Azure Monitor alert rules,
and it builds/pushes the three container images and deploys the Kubernetes
manifests.

1. Open a bash shell.

2. Clone the workshop repository and change the directory:

   ```bash
   git clone https://github.com/tmassoth/talk-sre-battlebot-configurator.git
   cd talk-sre-battlebot-configurator
   ```


3. Create your environment file from the template and open it for editing:

   ```bash
   cp .env.example .env
   vim .env
   ```

4. Set your **subscription ID** in the `.env` file. This is the only value you *must*
   set — everything else has sensible defaults:

   ```bash
   # in .env
   SUBSCRIPTION="<your-subscription-id>"
   LOCATION="swedencentral"
   ```

5. Load the variables and run the setup script:

   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

The script prints progress as it goes and takes roughly 15–20 minutes (AKS + SQL
provisioning + image builds dominate the time). When it finishes it prints the
public URL of the app in a banner, for example:

```
--------------------------------------------------------
-               URL: http://<public-ip>                -
--------------------------------------------------------
```

Copy that URL — you need it in Step 2.

> **Tip:** If you close the terminal, you can re-print the URL at any time:
>
> ```bash
> echo "http://$(kubectl -n battlebot-frontend get service/public-svc \
>   -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
> ```

---

## Step 2 — Open the website and verify BattleBotForge works

1. The script which has been executed previously, already fetched the kubeconfig. So, you should not need to connect to the AKS cluster one more time. Just run the commands below and confirm the workloads are running:

   ```bash
   kubectl get pods -n battlebot-backend
   kubectl get pods -n battlebot-frontend
   ```

   All pods should reach `Running`. The frontend is exposed through
   the `public-svc` LoadBalancer service in the `battlebot-frontend` namespace.

2. Open the URL from Step 1 in your browser.
 Your web browser may highlight that this site is unsecure or untrusted because it does not make use of of a certificate. Hence, it does not make use of HTTPS.

3. Walk through the configurator to confirm the app is healthy:
   - Pick a **chassis** (flipper, spinner, hammer).
   - Choose a **weapon power class**, a **paint job**, and a **weapon**.
   - Watch the **price** update in real time — this proves the catalog backend and
     the Azure SQL database are reachable.

4. Click **Complete Order**. The checkout deliberately probes an unreachable
   payment host, so you will see the payment-error card with the fixed error code
   **`PAY-MSUTY3ZE-1OFQ`**. This is expected — that same error code is what the
   Azure Monitor log alert watches for, and it is the trigger you will automate in
   Step 9.

---

## Step 3 — Create the Azure SRE Agent and connect Azure Monitor

1. Open the SRE Agent portal: <https://aka.ms/sreagent> (also reachable at
   <https://sre.azure.com>).

2. Select **Create** / **New agent** and fill in:
   - **Subscription:** the same subscription you deployed to.
   - **Resource group:** `talk-sre-battlebot-agent-rg` (created by `setup.sh`), or
     create a new one.
   - **Region:** `swedencentral`.
   - **Name:** e.g. `battlebot-sre-agent`.

3. When the agent is created, open its **Setup / Onboarding** page and connect the
   **incident platform**:
   - Choose **Azure Monitor** as the incident source.
   - Point it at the observability resources created by `setup.sh`
     (`talk-sre-battlebot-observability-rg`, which holds the Log Analytics
     workspace and Application Insights). This lets the agent see fired alerts.

4. Confirm the **Incidents** card shows **Connected to Azure Monitor** before
   continuing.

---

## Step 4 — Ask the agent to list your resources (before permissions)

Open the agent chat and send this prompt:

```
List all resources in my subscription.
```

At this point the agent has **not** been granted access to your subscription yet,
so it cannot enumerate resources. Expect it to respond that it has no permission /
no resources in scope, or to return an empty list. This is the expected "before"
state — you will fix it in the next step.

---

## Step 5 — Grant access with the SRE **Managed Resources** feature

The **Managed Resources** feature is how you tell the agent which Azure scopes it is
allowed to operate on. Adding a scope assigns the agent's managed identity the
required RBAC roles (Reader, Monitoring Reader, Log Analytics Reader, and the
write/Contributor roles it needs to remediate).

1. In the agent, open **Managed Resources** (sometimes under
   *Settings → Azure resources* / *Full setup → Azure resources*).

2. Click **Add** and select the scopes for this demo:
   - The subscription, **or** the individual resource groups created by `setup.sh`:
     - `talk-sre-battlebot-app-rg` (AKS + ACR)
     - `talk-sre-battlebot-database-rg` (Azure SQL)
     - `talk-sre-battlebot-observability-rg` (Log Analytics, App Insights, alerts)
     - `talk-sre-battlebot-agent-rg` (the agent)

3. Confirm the role assignments when prompted. (This requires **Owner** on the
   subscription — see Prerequisites.)

4. Wait until the **Azure resources** card shows the added scope with a green
   checkmark. RBAC propagation can take a minute or two.

---

## Step 6 — Re-run the list prompt (after permissions)

Send the same prompt again in the agent chat:

```
List all resources in my subscription.
```

Now that the agent has access through **Managed Resources**, it should enumerate
the resource groups and resources you added — AKS cluster, ACR, SQL server/database,
Log Analytics workspace, Application Insights, alert rules, and the agent itself.
This confirms the permissions from Step 5 are working end to end.

---

## Step 7 — Create a Kubernetes / container specialist sub-agent

Sub-agents are specialized personas the main agent can delegate to. Create one that
focuses on Kubernetes and container issues.

1. In the agent, open **Sub-agents** (also called *Custom agents*) and choose
   **Create sub-agent**.

2. Fill in the definition:

   - **Name:** `k8s-container-specialist`

   - **Description:**

     ```
     Specialist for diagnosing Azure Kubernetes Service (AKS) and container
     problems for the BattleBotForge app: pod scheduling, image pulls, crash
     loops, rollouts, and deployment health.
     ```

   - **Instructions / prompt:**

     ```
     You are a Kubernetes and container reliability specialist for the
     BattleBotForge workloads running on AKS.

     Scope:
     - Namespaces: battlebot-backend, battlebot-frontend
     - Deployments: battlebot-backend-catalog, battlebot-backend-payment,
       battlebot-frontend
     - Images come from the Azure Container Registry created for this demo.

     When investigating:
     1. Inspect pod status, events, and container states with read-only kubectl
        commands (get pods, describe pod, get events).
     2. Detect and clearly report image problems such as ImagePullBackOff /
        ErrImagePull, and state explicitly when an image tag does not exist in
        the registry.
     3. Cross-check the image reference in the Deployment against the tags that
        actually exist in ACR.
     4. Summarize the root cause, the affected deployment, and a concrete
        remediation (e.g. correct the image tag and re-apply).

     Prefer read-only diagnostics first. Only propose write actions after you
     have identified the root cause.
     ```

3. If prompted, allow the sub-agent to use the **Kubernetes read** tools
   (`RunKubectlReadCommand`) so it can inspect the cluster. Save the sub-agent.

---

## Step 8 — Break a deployment with a bad image tag, then let the sub-agent find it

Now create a realistic failure: point one container at an image tag that does not
exist in the registry, apply it, and watch Kubernetes fail to pull it. Then ask the
sub-agent from Step 7 to diagnose it.

1. Open the deployment manifest and change **one** image tag to a non-existent
   version. For example, edit
   [kubernetes/deployment.yaml](kubernetes/deployment.yaml) and change the catalog
   backend image from:

   ```yaml
   image: <acr-name>.azurecr.io/battlebot-backend-catalog:0.0.1
   ```

   to a tag that was never built/pushed:

   ```yaml
   image: <acr-name>.azurecr.io/battlebot-backend-catalog:9.9.9
   ```

   > Keep the registry name exactly as it appears in the file (it was filled in
   > from `ACR_NAME` when `setup.sh` rendered the manifests). Only change the
   > **tag**.

2. Apply the changed manifest:

   ```bash
   kubectl apply -f kubernetes/deployment.yaml
   ```

3. Watch the rollout fail — the new pods cannot pull the missing image:

   ```bash
   kubectl -n battlebot-backend get pods -w
   ```

   You should see the new `battlebot-backend-catalog` pods stuck in
   `ErrImagePull` / `ImagePullBackOff`. Inspect the events to confirm:

   ```bash
   kubectl -n battlebot-backend describe deploy battlebot-backend-catalog
   kubectl -n battlebot-backend get events --sort-by=.lastTimestamp | tail -n 20
   ```

4. In the agent chat, delegate the investigation to your sub-agent:

   ```
   @k8s-container-specialist The battlebot-backend-catalog deployment in the
   battlebot-backend namespace is failing to roll out. Investigate the pods and
   tell me the root cause.
   ```

   The sub-agent should inspect the pods/events, determine that the referenced
   **image tag does not exist** in the registry (ImagePullBackOff), and report that
   as the root cause — along with the fix (restore the valid `0.0.1` tag and
   re-apply).

5. Restore the working state when you are done:

   ```bash
   # revert the tag back to 0.0.1 in kubernetes/deployment.yaml, then:
   kubectl apply -f kubernetes/deployment.yaml
   kubectl -n battlebot-backend rollout status deploy battlebot-backend-catalog
   ```

---

## Step 9 — Automated incident response for alert `PAY-MSUTY3ZE-1OFQ`

Finally, build an **Incident Response Plan** that fires when the Azure Monitor log
alert **`PAY-MSUTY3ZE-1OFQ`** triggers (the payment-outage alert created by
`setup.sh`). When it fires, the agent should put the app into **maintenance mode**
and **restart** the frontend deployment.

### Background — what the alert is

`setup.sh` created a scheduled-query (log) alert named `PAY-MSUTY3ZE-1OFQ` in
`talk-sre-battlebot-observability-rg`. It queries Application Insights `exceptions`
for the payment error code and fires when the payment path is failing — the same
code you saw on the checkout page in Step 2.

### Create the response plan

1. In the agent, open **Incident response plans** (under *Response plans* /
   *Automation*) and choose **Create response plan**.

2. Configure the **trigger / filter** so it matches only this alert:
   - **Incident source:** Azure Monitor
   - **Alert rule name:** `PAY-MSUTY3ZE-1OFQ`
   - (Optional) scope it to `talk-sre-battlebot-observability-rg` so nothing else
     matches.

3. Set the **action / runbook** the agent should follow when the plan matches.
   Paste an instruction like this into the plan's steps:

   ```
   When the Azure Monitor alert "PAY-MSUTY3ZE-1OFQ" fires:

   1. Put the BattleBotForge frontend into maintenance mode by setting the
      maintenance flag on the frontend config map:
        kubectl -n battlebot-frontend patch configmap \
          battlebot-frontend-maintenance-mode \
          --type merge -p '{"data":{"VITE_MAINTENANCE_MODE":"true"}}'

   2. Restart the frontend so it picks up maintenance mode:
        kubectl -n battlebot-frontend rollout restart deploy battlebot-frontend
        kubectl -n battlebot-frontend rollout status deploy battlebot-frontend

   3. Summarize the incident: the fired alert, the action taken (maintenance mode
      + restart), and the current rollout status.
   ```

4. Save the response plan and make sure it is **enabled**.

### Test it

1. Trigger the alert by generating the payment error: open the app URL, configure a
   bot, and click **Complete Order** a few times to produce the
   `PAY-MSUTY3ZE-1OFQ` exceptions. The scheduled-query alert evaluates on its
   configured window, so allow a few minutes for it to fire.

2. Watch the incident appear in the SRE Agent **Incidents** view. The response plan
   should match the fired alert and the agent should execute the runbook —
   patching the config map into maintenance mode and restarting the frontend
   deployment.

3. Verify the result:

   ```bash
   kubectl -n battlebot-frontend get configmap battlebot-frontend-maintenance-mode -o yaml
   kubectl -n battlebot-frontend rollout status deploy battlebot-frontend
   ```

   The config map should show `VITE_MAINTENANCE_MODE: "true"` and the frontend
   should have completed a fresh rollout. Reloading the site now shows the
   maintenance notice with the **Complete Order** button disabled.

4. To take the app back out of maintenance mode after the demo:

   ```bash
   kubectl -n battlebot-frontend patch configmap battlebot-frontend-maintenance-mode \
     --type merge -p '{"data":{"VITE_MAINTENANCE_MODE":"false"}}'
   kubectl -n battlebot-frontend rollout restart deploy battlebot-frontend
   ```

---

## Cleanup

When the workshop is over, tear down all the Azure resource groups created by the
demo:

```bash
./cleanup.sh
```

This deletes the app, database, observability, and agent resource groups (the
delete runs in the background) and removes the generated Kubernetes manifests.

---

## Quick reference

| What | Value |
| --- | --- |
| Frontend namespace / service | `battlebot-frontend` / `public-svc` |
| Backend namespace | `battlebot-backend` |
| Deployments | `battlebot-backend-catalog`, `battlebot-backend-payment`, `battlebot-frontend` |
| Maintenance config map | `battlebot-frontend-maintenance-mode` (`VITE_MAINTENANCE_MODE`) |
| Payment alert / error code | `PAY-MSUTY3ZE-1OFQ` |
| SRE Agent portal | <https://aka.ms/sreagent> |
| Print app URL | `kubectl -n battlebot-frontend get service/public-svc -o jsonpath='{.status.loadBalancer.ingress[0].ip}'` |
