# ====== STAGE 1: Build ======
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Cachear dependencias primero (capa separada para builds más rápidos)
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# ====== STAGE 2: Runtime ======
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app

# Instalar wget para el healthcheck
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*


# Usuario no-root por seguridad (sintaxis Debian/Ubuntu)
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -M -s /bin/false appuser

COPY --from=builder /app/target/*.jar app.jar

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/actuator/health | grep '"status":"UP"' || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
