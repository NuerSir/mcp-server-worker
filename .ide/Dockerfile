# .ide/Dockerfile

FROM cnbcool/default-dev-env:latest

# 安装 code-server 和 vscode 常用插件
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash \
    && \. "$HOME/.nvm/nvm.sh" \
    && nvm install 22 \
    && nvm use 22