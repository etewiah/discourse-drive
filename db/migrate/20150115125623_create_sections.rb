class CreateSections < ActiveRecord::Migration
  def change
    create_table :sections do |t|
      t.string :name
      t.string :discette_name
      t.string :subdomain_lower
      t.text :meta
    end
  end
end
