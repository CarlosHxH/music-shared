package com.album.seplag.exception;

/**
 * Exceção lançada quando username ou email já está cadastrado.
 */
public class UsuarioJaExisteException extends RuntimeException {

    public UsuarioJaExisteException(String message) {
        super(message);
    }
}
