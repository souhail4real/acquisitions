#!/bin/bash

# Kubernetes deployment script for Acquisition App
# This script deploys the application to a Kubernetes cluster

set -e

echo "🚀 Deploying Acquisition App to Kubernetes"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="acquisitions"
K8S_DIR="k8s"
IMAGE="souhail4real/acquisitions:latest"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ Error: kubectl is not installed!${NC}"
    echo "   Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

# Check if connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Error: Not connected to a Kubernetes cluster!${NC}"
    echo "   Please configure kubectl to connect to your cluster."
    exit 1
fi

# Check if k8s directory exists
if [ ! -d "$K8S_DIR" ]; then
    echo -e "${RED}❌ Error: k8s directory not found!${NC}"
    exit 1
fi

# Function to check if secrets are configured
check_secrets() {
    echo -e "${YELLOW}⚠️  Checking secrets configuration...${NC}"
    
    # Check if secret exists in cluster
    if kubectl get secret acquisitions-secrets -n $NAMESPACE &> /dev/null; then
        echo -e "${GREEN}✅ Secrets already exist in cluster${NC}"
        return 0
    fi
    
    # Check if secrets need to be created
    echo -e "${YELLOW}⚠️  Secrets not found in cluster.${NC}"
    echo ""
    echo "Please update k8s/secret.yaml with base64 encoded values:"
    echo "  echo -n 'your-database-url' | base64"
    echo "  echo -n 'your-jwt-secret' | base64"
    echo ""
    read -p "Have you updated the secrets? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled. Please configure secrets first.${NC}"
        exit 1
    fi
}

# Deploy function
deploy() {
    echo ""
    echo "📦 Deploying to namespace: $NAMESPACE"
    echo "   Image: $IMAGE"
    echo ""
    
    # Apply manifests in order
    echo "1️⃣  Creating namespace..."
    kubectl apply -f $K8S_DIR/namespace.yaml
    
    echo "2️⃣  Applying ConfigMap..."
    kubectl apply -f $K8S_DIR/configmap.yaml
    
    echo "3️⃣  Applying Secrets..."
    kubectl apply -f $K8S_DIR/secret.yaml
    
    echo "4️⃣  Creating Deployment..."
    kubectl apply -f $K8S_DIR/deployment.yaml
    
    echo "5️⃣  Creating Service..."
    kubectl apply -f $K8S_DIR/service.yaml
    
    echo ""
    echo -e "${GREEN}✅ All manifests applied successfully!${NC}"
}

# Wait for deployment to be ready
wait_for_deployment() {
    echo ""
    echo "⏳ Waiting for deployment to be ready..."
    kubectl rollout status deployment/acquisitions-api -n $NAMESPACE --timeout=120s
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment is ready!${NC}"
    else
        echo -e "${RED}❌ Deployment timed out. Check logs for issues.${NC}"
        exit 1
    fi
}

# Show status
show_status() {
    echo ""
    echo "📊 Deployment Status:"
    echo "====================="
    
    echo ""
    echo "Pods:"
    kubectl get pods -n $NAMESPACE -l app=acquisitions-api
    
    echo ""
    echo "Services:"
    kubectl get svc -n $NAMESPACE
    
    echo ""
    echo "Endpoints:"
    kubectl get endpoints -n $NAMESPACE
}

# Print access instructions
print_instructions() {
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "========================"
    echo ""
    echo "To access the application:"
    echo ""
    echo "  # Port forward to local machine"
    echo "  kubectl port-forward -n $NAMESPACE svc/acquisitions-api 8080:80"
    echo ""
    echo "  # Then access at: http://localhost:8080"
    echo ""
    echo "Useful commands:"
    echo "  # View logs"
    echo "  kubectl logs -n $NAMESPACE -l app=acquisitions-api -f"
    echo ""
    echo "  # Scale deployment"
    echo "  kubectl scale deployment/acquisitions-api -n $NAMESPACE --replicas=5"
    echo ""
    echo "  # Restart deployment"
    echo "  kubectl rollout restart deployment/acquisitions-api -n $NAMESPACE"
    echo ""
    echo "  # Delete everything"
    echo "  kubectl delete namespace $NAMESPACE"
}

# Main execution
main() {
    case "${1:-deploy}" in
        deploy)
            check_secrets
            deploy
            wait_for_deployment
            show_status
            print_instructions
            ;;
        status)
            show_status
            ;;
        logs)
            kubectl logs -n $NAMESPACE -l app=acquisitions-api -f
            ;;
        delete)
            echo -e "${YELLOW}⚠️  This will delete the entire namespace and all resources!${NC}"
            read -p "Are you sure? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kubectl delete namespace $NAMESPACE
                echo -e "${GREEN}✅ Namespace deleted${NC}"
            fi
            ;;
        port-forward)
            echo "🔗 Starting port forward on http://localhost:8080"
            kubectl port-forward -n $NAMESPACE svc/acquisitions-api 8080:80
            ;;
        *)
            echo "Usage: $0 {deploy|status|logs|delete|port-forward}"
            exit 1
            ;;
    esac
}

main "$@"
