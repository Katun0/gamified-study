<?php

namespace App\Command;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:user:promote-admin', description: 'Concede acesso administrativo a um usuário existente.')]
final class PromoteAdminCommand extends Command
{
    public function __construct(private UserRepository $users, private EntityManagerInterface $entityManager)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('email', InputArgument::REQUIRED, 'E-mail do usuário');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $user = $this->users->findOneBy(['email' => strtolower(trim($input->getArgument('email')))]);
        if (!$user) {
            $output->writeln('Usuário não encontrado. Cadastre a conta primeiro.');
            return Command::FAILURE;
        }
        $user->setRoles([...$user->getRoles(), 'ROLE_ADMIN']);
        $this->entityManager->flush();
        $output->writeln('Acesso administrativo concedido.');
        return Command::SUCCESS;
    }
}
