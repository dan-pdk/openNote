import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "openNote",
    description: "Termos de Serviço do projeto acadêmico openNote",
};

export default function TermsPage() {
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
                    <h1 className="text-3xl font-semibold mt-1">Termos de Serviço</h1>
                    <p className="text-sm text-black/60 dark:text-white/60 mt-2">
                        Ao acessar e utilizar o openNote, você concorda com os termos descritos abaixo:
                    </p>
                </div>

                <section className="bg-[#E2E2E2]/60 dark:bg-[#303030] rounded-2xl p-6 flex flex-col gap-5 text-sm leading-relaxed text-black/85 dark:text-white/85">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            1. Natureza do projeto
                        </h2>
                        <p>
                            O openNote é uma aplicação web desenvolvida como trabalho escolar para organização colaborativa de tarefas, oferecida gratuitamente &ldquo;no estado em que se encontra&rdquo;, sem fins comerciais ou compromissos com qualidade.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            2. Uso adequado
                        </h2>
                        <p>
                            Ao criar salas, tarefas ou comentários, você concorda em não publicar conteúdo ilegal ou contendo dados sensíveis (senhas, cartões de crédito, endereços). Também concorda com não ser anti-resenha.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            3. Disponibilidade e ausência de garantias
                        </h2>
                        <p>
                            Por se tratar de um projeto acadêmico descartável, não há garantias de tempo de serviço integral e muito menos suporte ao cliente. Consulte o código fonte no GitHub e faça uma pull request se quiser arrumar algo que (inevitavelmente) esquecemos.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            4. Contas e moderação
                        </h2>
                        <p>
                            O acesso é realizado via autenticação Google. Os desenvolvedores responsáveis pelo projeto reservam-se o direito de remover conteúdos ou contas que violem o bom uso da plataforma durante o período de avaliação ou remover conteúdos que sejam contra a resenha. Você concorda com o risco de ser oprimido nessa plataforma.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            5. Contato
                        </h2>
                        <p>
                            Dúvidas ou solicitações relacionadas ao projeto deveriam ser mantidas para si mesmo. Se necessário, envie um e-mail para <a href="mailto:macacopedreiropedreiragem@gmail.com">macacopedreiropedreiragem@gmail.com</a>
                        </p>
                    </div>
                </section>

                <footer className="flex items-center justify-between text-xs text-black/50 dark:text-white/50 pt-2">
                    <span>openNote</span>
                    <Link href="/privacy" className="hover:underline text-teal-600 dark:text-teal-400">
                        Ver Política de Privacidade
                    </Link>
                </footer>
            </main>
        </div>
    );
}