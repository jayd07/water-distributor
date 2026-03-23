# -------- BUILD STAGE --------
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

# -------- RUNTIME STAGE --------
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy jar dynamically
COPY --from=build /app/target/*.jar app.jar

# Render provides PORT dynamically
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
