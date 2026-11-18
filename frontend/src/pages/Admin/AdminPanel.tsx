import { Link } from "react-router-dom";
import { ArrowForwardRounded, AutoAwesomeRounded, CodeRounded, MenuBookRounded, SchoolRounded } from "@mui/icons-material";
import AdminLayout from "../../components/layout/AdminLayout";

const actions = [
  { to:"/courses/new", title:"Criar curso", description:"Monte uma nova jornada de programação, com nome e apresentação do conteúdo.", icon:<SchoolRounded /> },
  { to:"/lessons/new", title:"Criar lição", description:"Organize o aprendizado em pequenas etapas e explique cada conceito.", icon:<MenuBookRounded /> },
  { to:"/problems/new", title:"Criar desafio", description:"Crie exercícios de código e configure testes para a correção automática.", icon:<CodeRounded /> },
];
export default function AdminPanel(){
  return <AdminLayout current="admin" eyebrow="ÁREA DO CRIADOR" title="Central de missões" description="Tudo o que você precisa para transformar conhecimento em aventuras de programação." icon={<AutoAwesomeRounded />}>
    <div className="sq-admin-grid">
      {actions.map((action)=><article className="sq-admin-card" key={action.to}><span className="sq-admin-card-icon">{action.icon}</span><h2>{action.title}</h2><p>{action.description}</p><Link to={action.to}>Começar <ArrowForwardRounded fontSize="small" /></Link></article>)}
    </div>
    <div className="sq-admin-helper"><strong>Ordem recomendada:</strong> crie primeiro um curso, depois as lições e, por último, associe desafios e casos de teste a cada lição. Suas alterações continuam sendo salvas pela API Symfony.</div>
  </AdminLayout>;
}
