FROM docker:cli AS cli
FROM python:3.13-slim
COPY --from=cli /usr/local/bin/docker /usr/local/bin/docker
WORKDIR /opt/executor
COPY app ./app
ENV PYTHONDONTWRITEBYTECODE=1 EXECUTOR_HOST=0.0.0.0 EXECUTOR_PORT=8001
USER 65534:65534
EXPOSE 8001
CMD ["python", "-m", "app.api.server"]
