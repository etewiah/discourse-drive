Drive::Engine.routes.draw do
  root to: 'discette#landing'
  get "/" => "discette#landing"
  get "*path" => "discette#landing"
end
