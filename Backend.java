import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class Backend {
    private static final String BD_URL = "jdbc:mariadb://localhost:3306/skillbridge";
    private static final String BD_USUARIO = "teste";
    private static final String BD_SENHA = "123";

    public static void main(String[] argumentos) throws IOException  {
        int porta = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(porta), 0);
        
        String rota = "/api/dados";
        server.createContext(rota, new DadosHandler());

        server.setExecutor(null); 
        server.start();

        String host = "http://localhost:8080";
        System.out.println("servidor java rodando em " + host + rota);
    }
    static class DadosHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            String jsonResposta = "[]";

            try (Connection conexao = DriverManager.getConnection(BD_URL, BD_USUARIO, BD_SENHA);
                 Statement instrucao = conexao.createStatement()) {

                ResultSet dados = instrucao.executeQuery("SELECT * from alunos");
                
                StringBuilder resposta = new StringBuilder();
                resposta.append("[");
                while (dados.next()) {
                    resposta.append("\"").append(dados.getString("nome")).append("\",");
                }
                if (resposta.length() > 1) {
                    resposta.setLength(resposta.length() - 1);
                }
                resposta.append("]");

                jsonResposta = resposta.toString();

            } catch (Exception erro) {
                erro.printStackTrace();
                jsonResposta = "{\"erro\": \"erro ao conectar no mariadb\"}";
            }

            byte[] bytes = jsonResposta.getBytes("UTF-8");
            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        }
    }
}