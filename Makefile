# ─────────────────────────────────────────────
#  rwd-viewer — Docker build & release Makefile
# ─────────────────────────────────────────────
#
# Configurable via environment variables:
#
#   REGISTRY     Docker registry hostname (default: docker.io)
#   VERSION      Image version tag        (default: latest)
#   PUSH_LATEST  Also tag/push :latest when VERSION is set
#                to a specific version    (default: false)
#
# Examples:
#   make build
#   make build VERSION=1.2.3
#   make release VERSION=1.2.3 PUSH_LATEST=true
#   make release VERSION=1.2.3 REGISTRY=ghcr.io PUSH_LATEST=true
# ─────────────────────────────────────────────

REGISTRY    ?= docker.io
IMAGE_NAME  := idsquare/rwd-viewer
VERSION     ?= latest
PUSH_LATEST ?= false

# Full image reference, e.g. docker.io/idsquare/rwd-viewer:1.2.3
FULL_IMAGE  := $(REGISTRY)/$(IMAGE_NAME):$(VERSION)
LATEST_IMAGE := $(REGISTRY)/$(IMAGE_NAME):latest

.PHONY: help build push release run stop clean

## help: show this help message
help:
	@echo ""
	@echo "Usage: make <target> [VAR=value ...]"
	@echo ""
	@echo "Variables:"
	@echo "  REGISTRY     Docker registry hostname  (default: docker.io)"
	@echo "  VERSION      Image version tag          (default: latest)"
	@echo "  PUSH_LATEST  Tag and push :latest too   (default: false)"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
	@echo ""

## build: build the Docker image for VERSION (and :latest if PUSH_LATEST=true)
build:
	@echo ">>> Building $(FULL_IMAGE)"
	docker build \
		--tag $(FULL_IMAGE) \
		$(if $(filter true,$(PUSH_LATEST)),--tag $(LATEST_IMAGE),) \
		.

## push: push VERSION image to REGISTRY (and :latest if PUSH_LATEST=true)
push:
	@echo ">>> Pushing $(FULL_IMAGE)"
	docker push $(FULL_IMAGE)
	@if [ "$(PUSH_LATEST)" = "true" ]; then \
		echo ">>> Pushing $(LATEST_IMAGE)"; \
		docker push $(LATEST_IMAGE); \
	fi

## release: build then push (equivalent to: make build push)
release: build push

## run: start the app with docker compose (uses VERSION env var)
run:
	VERSION=$(VERSION) docker compose up -d

## stop: stop the app with docker compose
stop:
	docker compose down

## clean: remove the local versioned image
clean:
	-docker rmi $(FULL_IMAGE) 2>/dev/null
	@if [ "$(PUSH_LATEST)" = "true" ]; then \
		docker rmi $(LATEST_IMAGE) 2>/dev/null || true; \
	fi
