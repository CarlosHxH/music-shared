package com.album.seplag;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SeplagApplication {

	public static void main(String[] args) {
		SpringApplication.run(SeplagApplication.class, args);
	}

}
