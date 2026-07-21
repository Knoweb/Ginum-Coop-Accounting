package com.example.GinumApps;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class GinumAppsApplication extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(GinumAppsApplication.class);
	}

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(GinumAppsApplication.class);
		app.addInitializers(new com.example.GinumApps.config.DatabaseBootstrapper());
		app.run(args);
	}
}
