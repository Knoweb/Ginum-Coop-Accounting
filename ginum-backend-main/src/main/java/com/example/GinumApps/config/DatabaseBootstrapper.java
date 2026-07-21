package com.example.GinumApps.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DatabaseBootstrapper implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final Logger log = LoggerFactory.getLogger(DatabaseBootstrapper.class);

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();
        
        String appEnv = env.getProperty("APP_ENV", "local");
        if (!"local".equalsIgnoreCase(appEnv) && !"development".equalsIgnoreCase(appEnv)) {
            log.warn("Auto database creation disabled in production. (APP_ENV={})", appEnv);
            return;
        }

        String dbHost = env.getProperty("DB_HOST", "localhost");
        if (!"localhost".equalsIgnoreCase(dbHost) && !"127.0.0.1".equals(dbHost)) {
            log.error("Refusing to auto-create database on non-local host: {}", dbHost);
            return;
        }

        String dbPort = env.getProperty("DB_PORT", "5432");
        String dbName = env.getProperty("DB_NAME", "ginuma_coop_local");
        String dbUser = env.getProperty("DB_USER", "postgres");
        String dbPassword = env.getProperty("DB_PASSWORD", "postgres");

        // Connect to the default maintenance db 'postgres'
        String maintenanceUrl = "jdbc:postgresql://" + dbHost + ":" + dbPort + "/postgres";

        log.info("Checking if PostgreSQL database '{}' exists...", dbName);

        try (Connection connection = DriverManager.getConnection(maintenanceUrl, dbUser, dbPassword);
             Statement statement = connection.createStatement()) {

            ResultSet resultSet = statement.executeQuery("SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'");
            if (!resultSet.next()) {
                System.out.println("Database '" + dbName + "' does not exist. Creating it...");
                log.info("Database '{}' does not exist. Creating it...", dbName);
                statement.executeUpdate("CREATE DATABASE " + dbName);
                System.out.println("Database '" + dbName + "' created successfully. Proceeding with application startup.");
                log.info("Database '{}' created successfully. Proceeding with application startup.", dbName);
            } else {
                System.out.println("Database '" + dbName + "' already exists. Proceeding with application startup.");
                log.info("Database '{}' already exists. Proceeding with application startup.", dbName);
            }

        } catch (Exception e) {
            log.error("Failed to auto-create database '{}'", dbName, e);
        }
    }
}
