import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "openNote",
    description: "Política de Privacidade do projeto acadêmico openNote",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#1D1D1D] text-black dark:text-white">
            <header className="flex items-center justify-between px-4 py-4 lg:px-10 border-b border-black/15 dark:border-white/15">
                <Link href="/login">
                    <Image
                        src="/LogoDesktopLight.svg"
                        width={160}
                        height={34}
                        alt="openNote"
                        className="dark:hidden"
                    />
                    <Image
                        src="/LogoDesktop.svg"
                        width={160}
                        height={34}
                        alt="openNote"
                        className="hidden dark:block"
                    />
                </Link>

                <Link
                    href="/login"
                    className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
                >
                    Voltar ao início
                </Link>
            </header>

            <main className="px-4 py-8 lg:px-10 max-w-3xl mx-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-semibold mt-1">Política de Privacidade</h1>
                    <p className="text-sm text-black/60 dark:text-white/60 mt-2">
                        OpenNote é um projeto acadêmico desenvolvido exclusivamente para fins educacionais.
                    </p>
                </div>

                <section className="bg-[#E2E2E2]/60 dark:bg-[#303030] rounded-2xl p-6 flex flex-col gap-5 text-sm leading-relaxed text-black/85 dark:text-white/85">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            I. Dados que coletamos
                        </h2>
                        <p>
                            Ao entrar na plataforma, recebemos apenas essas informações:
                        </p>
                        <ul className="list-disc pl-5 flex flex-col gap-1">
                            <li>Nome de exibição;</li>
                            <li>Endereço de e-mail;</li>
                            <li>Foto de perfil fornecida pela Google.</li>
                        </ul>
                        <p>Nunca armazenaremos sua senha ou outros dados sensíveis. Seu e-mail será oculto para outros usuários por padrão.</p>
                        <p>
                            Também armazenamos o conteúdo que você cria dentro da aplicação, como nomes de salas, tarefas, datas de entrega, descrições e comentários.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            2. Como usamos esses dados
                        </h2>
                        <p>
                            Seus dados são utilizados exclusivamente para autenticar seu acesso, vincular você às salas que criar ou participar e exibir seu nome e foto aos outros usuários que compartilham salas com você. Não vendemos, alugamos ou utilizamos seus dados para fins comerciais ou publicitários, ou sequer nos importamos com eles.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            3. Armazenamento e cookies
                        </h2>
                        <p>
                            A aplicação é hospedada na Vercel e os dados são armazenados em banco de dados PostgreSQL na plataforma Neon. Utilizamos apenas os cookies essenciais de sessão para manter você conectado durante o uso; não coletamos informações pessoais.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            4. Disponibilidade e exclusão
                        </h2>
                        <p>
                            Por se tratar de um projeto escolar, o banco de dados pode ser limpo ou desativado após o encerramento das avaliações acadêmicas. Você pode excluir sua conta a qualquer momento, juntamente com toda sua atividade na plataforma.
                        </p>
                    </div>
                </section>

                <footer className="flex items-center justify-between text-xs text-black/50 dark:text-white/50 pt-2">
                    <span>openNote</span>
                    <Link href="/terms" className="hover:underline text-teal-600 dark:text-teal-400">
                        Ver Termos de Serviço
                    </Link>
                </footer>
            </main>
        </div>
    );
}