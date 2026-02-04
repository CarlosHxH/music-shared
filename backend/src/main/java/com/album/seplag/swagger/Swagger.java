package com.album.seplag.swagger;

import com.album.seplag.dto.ErrorResponse;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OpenApiCustomizer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@OpenAPIDefinition
@Configuration
@SecurityScheme(name = "Bearer Authentication", type = SecuritySchemeType.HTTP, bearerFormat = "JWT", scheme = "bearer")
public class Swagger {

    private static final String ERROR_RESPONSE_REF = "#/components/schemas/ErrorResponse";

    @Bean
    public OpenAPI customOpenAPI() {
        var resolvedSchema = ModelConverters.getInstance()
                .resolveAsResolvedSchema(new AnnotatedType(ErrorResponse.class));

        Components components = new Components();
        components.addSchemas("ErrorResponse", resolvedSchema.schema);
        if (resolvedSchema.referencedSchemas != null) {
            resolvedSchema.referencedSchemas.forEach(components::addSchemas);
        }

        return new OpenAPI()
                .components(components)
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Servidor Local"),
                        new Server()
                                .url("http://backend:8080")
                                .description("Servidor de Produção")))
                .info(new Info()
                        .title("Album API")
                        .version("1.0.0")
                        .description("API REST para gerenciamento de artistas e álbuns musicais")
                        .contact(new Contact()
                                .name("Carlos")
                                .email("carlosdaniel.prog@gmail.com"))
                .license(new License()
                        .name("Apache 2.0")
                        .url("https://www.apache.org/licenses/LICENSE-2.0.html")));
    }

    @Bean
    public OpenApiCustomizer openApiCustomizer() {
        Schema<?> errorSchema = new Schema<>().$ref(ERROR_RESPONSE_REF);
        MediaType errorMediaType = new MediaType().schema(errorSchema);
        Content errorContent = new Content().addMediaType("application/json", errorMediaType);

        ApiResponse unauthorized = new ApiResponse()
                .description("Token inválido ou expirado")
                .content(errorContent);
        ApiResponse forbidden = new ApiResponse()
                .description("Acesso negado (ex: usuário sem role ADMIN tentando endpoint restrito)")
                .content(errorContent);
        ApiResponse notFound = new ApiResponse()
                .description("Recurso não encontrado (ex: ID de álbum ou artista inexistente)")
                .content(errorContent);
        ApiResponse unprocessable = new ApiResponse()
                .description("Erro de validação (ex: senha curta demais, email inválido)")
                .content(errorContent);
        ApiResponse serverError = new ApiResponse()
                .description("Erro interno do servidor")
                .content(errorContent);

        return openApi -> openApi.getPaths().values().forEach(pathItem ->
                pathItem.readOperations().forEach(operation -> {
                    operation.getResponses()
                            .addApiResponse("401", unauthorized)
                            .addApiResponse("403", forbidden)
                            .addApiResponse("404", notFound)
                            .addApiResponse("422", unprocessable)
                            .addApiResponse("500", serverError);
                }));
    }
}
